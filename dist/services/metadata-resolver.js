import { MetadataCache } from './metadata-cache.js';
/**
 * Definitively identifies the origin module of a Odoo model using ir.model.data (XML ID).
 */
export async function resolveBaseModule(client, modelId, moduleListStr) {
    const moduleList = moduleListStr.split(',').map(m => m.trim());
    try {
        const mDatas = await client.executeKw('ir.model.data', 'search_read', [
            [['model', '=', 'ir.model'], ['res_id', '=', modelId]]
        ], {
            fields: ['module']
        });
        const allOriginMods = mDatas.map((m) => m.module);
        if (allOriginMods.includes('base')) {
            return 'base';
        }
        else if (allOriginMods.length > 0) {
            // Return the shortest module name (e.g., 'sale' vs 'sale_management')
            const sorted = [...allOriginMods].sort((a, b) => a.length - b.length);
            return sorted[0];
        }
        else {
            return moduleList[0];
        }
    }
    catch (error) {
        return moduleList[0];
    }
}
/**
 * Builds, categorizes, and resolves complete metadata layout for a model,
 * including auto-detecting the "Belonging Relation" and background warming parent modules.
 */
export async function buildModelMetadata(client, model, instanceAlias = 'default') {
    // 1. Resolve Model metadata
    const modelInfo = await client.executeKw('ir.model', 'search_read', [[['model', '=', model]]], {
        fields: ['id', 'name', 'modules', 'transient'],
        limit: 1
    });
    if (!modelInfo || modelInfo.length === 0)
        throw new Error(`Model not found: ${model}`);
    const m = modelInfo[0];
    const baseModule = await resolveBaseModule(client, m.id, m.modules || '');
    // 2. Fetch Fields and Filter
    const fRecords = await client.executeKw('ir.model.fields', 'search_read', [[['model_id.model', '=', model]]], {
        fields: ['name', 'field_description', 'ttype', 'relation', 'required', 'readonly', 'store', 'translate', 'company_dependent', 'help', 'domain', 'modules', 'compute', 'related']
    });
    const buckets = { base: {}, extended: {}, computed: {}, related: {}, relational: {}, lines: {} };
    const baseFields = ['id'];
    for (const f of fRecords) {
        // A. Exclude chatter and activity system fields (aligning with Python chatter category bypass)
        if (f.name.startsWith('message_') || f.name.startsWith('activity_')) {
            continue;
        }
        const isBase = f.modules.split(',').map((mod) => mod.trim()).includes(baseModule);
        const props = [];
        if (f.required)
            props.push('required');
        if (f.readonly)
            props.push('readonly');
        if (!f.store)
            props.push('not-stored');
        if (f.translate)
            props.push('translatable');
        if (f.company_dependent)
            props.push('company-dependent');
        const fieldData = {
            type: f.ttype,
            string: f.field_description,
            relation: f.relation || undefined,
            properties: props.length > 0 ? props : undefined,
            help: f.help || undefined,
        };
        if (f.domain && f.domain !== '[]') {
            fieldData.hint = `Search Filter: ${f.domain}`;
        }
        // B. Strict if/else-if categorization cascade
        if (f.related) {
            buckets.related[f.name] = fieldData;
        }
        else if (!f.store) {
            buckets.computed[f.name] = fieldData;
        }
        else if (f.ttype === 'one2many') {
            buckets.lines[f.name] = fieldData;
        }
        else if (['many2one', 'many2many', 'reference'].includes(f.ttype)) {
            buckets.relational[f.name] = fieldData;
        }
        else if (!isBase) {
            buckets.extended[f.name] = fieldData;
        }
        else {
            buckets.base[f.name] = fieldData;
        }
    }
    // 3. Assemble High-Signal Default Search Fields (Breadth Layout)
    // Essential baseline fields
    const hasDisplayName = fRecords.some((f) => f.name === 'display_name');
    const hasName = fRecords.some((f) => f.name === 'name');
    if (hasDisplayName)
        baseFields.push('display_name');
    if (hasName && !baseFields.includes('name'))
        baseFields.push('name');
    // Add state/lifecycle fields if they exist
    const stateFields = ['state', 'active', 'stage_id', 'status'];
    for (const sf of stateFields) {
        if (fRecords.some((f) => f.name === sf)) {
            baseFields.push(sf);
        }
    }
    // Add freshness fields if they exist
    const freshnessFields = ['write_date', 'create_date'];
    for (const ff of freshnessFields) {
        if (fRecords.some((f) => f.name === ff)) {
            baseFields.push(ff);
        }
    }
    // 4. Dynamically Identify the Hierarchical "Belonging Relation" parent (M2O)
    // Check for many2one fields that link this record to its parent namespace or compositional parent
    const m2oFields = fRecords.filter((f) => f.ttype === 'many2one');
    const namespacePrefix = model.split('.')[0]; // e.g. 'project' from 'project.task'
    let belongingRelation = null;
    // Step 1: Look for exact relation with parent namespace (e.g. project_id on project.task)
    const prefixMatch = m2oFields.find((f) => f.name === `${namespacePrefix}_id`);
    if (prefixMatch) {
        belongingRelation = prefixMatch.name;
    }
    else {
        // Step 2: Fallback to standard composition names
        const compMatch = m2oFields.find((f) => ['parent_id', 'order_id', 'move_id', 'invoice_id', 'group_id'].includes(f.name));
        if (compMatch) {
            belongingRelation = compMatch.name;
        }
    }
    if (belongingRelation) {
        baseFields.push(belongingRelation);
        // 5. Related Model Warming: silently warm parent metadata asynchronously
        const parentField = m2oFields.find((f) => f.name === belongingRelation);
        if (parentField && parentField.relation) {
            const parentModel = parentField.relation;
            // We spawn this asynchronously in the background so it warms up for future queries
            buildModelMetadata(client, parentModel, instanceAlias)
                .then((parentMeta) => {
                MetadataCache.getInstance().set(instanceAlias, parentModel, parentMeta);
            })
                .catch(() => { });
        }
    }
    // Deduplicate
    const deduplicatedFields = Array.from(new Set(baseFields));
    return {
        baseModule,
        id: m.id,
        name: m.name,
        transient: m.transient,
        modules: m.modules || '',
        baseFields: deduplicatedFields,
        categorized: buckets
    };
}
//# sourceMappingURL=metadata-resolver.js.map