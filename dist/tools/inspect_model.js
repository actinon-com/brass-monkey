import { z } from 'zod';
/**
 * Zod schema for inspect_model tool input.
 * Full parity with original brass-compass flags for deep introspection.
 */
export const InspectModelSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    show_base: z.boolean().optional().default(true).describe("Include standard 'Base' fields (Name, Active, ID, etc.)."),
    show_extended: z.boolean().optional().default(false).describe("Include fields added by extension modules."),
    show_computed: z.boolean().optional().default(false).describe("Include non-stored, calculated fields."),
    show_related: z.boolean().optional().default(false).describe("Include mirror fields from related models."),
    show_lines: z.boolean().optional().default(false).describe("Include One2many and Many2many field definitions."),
    show_relationships: z.boolean().optional().default(false).describe("Include relational IDs (Many2one definitions)."),
    show_stats: z.boolean().optional().default(false).describe("Include record counts (Active vs Archived) and storage metrics."),
    show_access: z.boolean().optional().default(false).describe("Include Access Control Lists (ACLs) and Record Rules."),
    show_modules: z.boolean().optional().default(false).describe("Include module lineage (Inheritance hierarchy)."),
    show_ui: z.boolean().optional().default(false).describe("Include associated View XML IDs and Window Actions."),
    show_methods: z.boolean().optional().default(false).describe("Include Server Actions and available execution points."),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Definitively identifies the origin module of a model using ir.model.data (XML ID).
 */
async function resolveBaseModule(client, modelId, moduleListStr) {
    const moduleList = moduleListStr.split(',').map(m => m.trim());
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
        // Return the shortest module name (e.g., 'sale' vs 'sale_management' or 'helpdesk_sale_timesheet')
        const sorted = [...allOriginMods].sort((a, b) => a.length - b.length);
        return sorted[0];
    }
    else {
        return moduleList[0];
    }
}
/**
 * Tool to perform a deep architectural audit of an Odoo model's definition.
 * Dynamically categorizes fields and discovers execution/UI entry points.
 */
export async function inspectModel(manager, input) {
    const { model, instance_alias, ...flags } = input;
    const client = await manager.getClient(instance_alias);
    // 1. Resolve Model Metadata
    const modelInfo = await client.executeKw('ir.model', 'search_read', [[['model', '=', model]]], {
        fields: ['id', 'name', 'modules', 'transient'],
        limit: 1
    });
    if (!modelInfo || modelInfo.length === 0)
        throw new Error(`Model not found: ${model}`);
    const m = modelInfo[0];
    let baseModule = '';
    let debugErr = null;
    try {
        baseModule = await resolveBaseModule(client, m.id, m.modules || '');
    }
    catch (e) {
        debugErr = e.message || String(e);
    }
    const res = {
        identity: {
            model: model,
            description: m.name,
            base_module: baseModule,
            is_transient: m.transient,
            _debug_error: debugErr
        }
    };
    // 2. Fetch Field Metadata if any field flag is set
    const anyFieldFlag = flags.show_base || flags.show_extended || flags.show_computed || flags.show_related || flags.show_lines || flags.show_relationships;
    if (anyFieldFlag) {
        const fRecords = await client.executeKw('ir.model.fields', 'search_read', [[['model_id', '=', m.id]]], {
            fields: ['name', 'field_description', 'ttype', 'relation', 'store', 'compute', 'related', 'modules', 'readonly', 'required', 'selection', 'help', 'translate', 'company_dependent', 'domain']
        });
        const buckets = { base: {}, extended: {}, computed: {}, related: {}, relational: {}, lines: {} };
        for (const f of fRecords) {
            // Split the comma-separated modules and check for exact module matching (prevents substring matching like sale_stock matching sale)
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
            if (f.compute)
                buckets.computed[f.name] = fieldData;
            if (f.related)
                buckets.related[f.name] = fieldData;
            if (['many2one', 'reference'].includes(f.ttype))
                buckets.relational[f.name] = fieldData;
            if (['one2many', 'many2many'].includes(f.ttype))
                buckets.lines[f.name] = fieldData;
            if (isBase)
                buckets.base[f.name] = fieldData;
            else
                buckets.extended[f.name] = fieldData;
        }
        res.fields = {};
        if (flags.show_base)
            res.fields.base = buckets.base;
        if (flags.show_extended)
            res.fields.extended = buckets.extended;
        if (flags.show_computed)
            res.fields.computed = buckets.computed;
        if (flags.show_related)
            res.fields.related = buckets.related;
        if (flags.show_relationships)
            res.fields.relationships = buckets.relational;
        if (flags.show_lines)
            res.fields.lines = buckets.lines;
    }
    // 3. Stats
    if (flags.show_stats) {
        const total = await client.executeKw(model, 'search_count', [[]]);
        res.stats = { records: { total } };
        try {
            res.stats.records.active = await client.executeKw(model, 'search_count', [[['active', '=', true]]]);
            res.stats.records.archived = await client.executeKw(model, 'search_count', [[['active', '=', false]]]);
        }
        catch (e) { }
    }
    // 4. Methods
    if (flags.show_methods) {
        const serverActions = await client.executeKw('ir.actions.server', 'search_read', [[['model_id', '=', m.id]]], {
            fields: ['name', 'state', 'usage']
        });
        res.execution_points = {
            server_actions: serverActions.reduce((acc, a) => {
                acc[a.name] = { state: a.state, usage: a.usage, id: a.id };
                return acc;
            }, {})
        };
        // Try to find methods from view buttons
        try {
            const views = await client.executeKw('ir.ui.view', 'search_read', [[['model', '=', model], ['type', '=', 'form']]], {
                fields: ['arch_db'],
                limit: 5
            });
            const buttonMethods = new Set();
            const btnRegex = /<button[^>]+name="([^"]+)"[^>]+type="object"/g;
            for (const v of views) {
                let match;
                while ((match = btnRegex.exec(v.arch_db)) !== null) {
                    buttonMethods.add(match[1]);
                }
            }
            res.execution_points.view_methods = Array.from(buttonMethods).sort();
        }
        catch (e) { }
    }
    // 5. UI Entry Points
    if (flags.show_ui) {
        const views = await client.executeKw('ir.ui.view', 'search_read', [[['model', '=', model], ['inherit_id', '=', false]]], {
            fields: ['name', 'type', 'xml_id']
        });
        res.ui = { views: {} };
        for (const v of views) {
            if (!res.ui.views[v.type])
                res.ui.views[v.type] = {};
            res.ui.views[v.type][v.xml_id || v.id] = v.name;
        }
    }
    // 6. Security
    if (flags.show_access) {
        const acls = await client.executeKw('ir.model.access', 'search_read', [[['model_id', '=', m.id]]], {
            fields: ['group_id', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink']
        });
        res.security = {
            acls: acls.map((a) => ({
                group: a.group_id ? a.group_id[1] : 'Global',
                read: a.perm_read, write: a.perm_write, create: a.perm_create, unlink: a.perm_unlink
            }))
        };
    }
    return res;
}
//# sourceMappingURL=inspect_model.js.map