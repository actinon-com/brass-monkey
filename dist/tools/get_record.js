import { z } from 'zod';
import { MetadataCache } from '../services/metadata-cache.js';
import { buildModelMetadata } from '../services/metadata-resolver.js';
import { OdooOrchestrator } from '../services/odoo-orchestrator.js';
/**
 * Zod schemas for get_record and get_records tool inputs.
 */
export const GetRecordSchema = z.object({
    model: z.string().optional().describe('Technical model name (required if xml_id is not provided)'),
    res_id: z.coerce.number().optional().describe('Database ID of the record (required if xml_id is not provided)'),
    xml_id: z.string().optional().describe('Technical XML ID (e.g., "base.user_admin"). Resolves model and ID.'),
    show_meta: z.boolean().optional().default(false).describe('Include system metadata (creation/write dates and users).'),
    show_security: z.boolean().optional().default(false).describe('Perform real-time access checks for the current user.'),
    show_relationships: z.boolean().optional().default(false).describe('Resolve display names for relational many2one fields.'),
    show_extended: z.boolean().optional().default(false).describe('Include fields from extension modules.'),
    show_computed: z.boolean().optional().default(false).describe('Include dynamically calculated fields.'),
    show_related: z.boolean().optional().default(false).describe('Include mirror fields from related models.'),
    show_lines: z.boolean().optional().default(false).describe('Resolve and include full data for x2many sub-line fields.'),
    show_chatter: z.boolean().optional().default(false).describe('Include message threads from Odoo Chatter.'),
    include_binary: z.boolean().optional().default(false).describe('Include raw base64 data for binary fields.'),
    show_all_fields: z.boolean().optional().default(false).describe('Force inclusion of EVERY field defined on the model.'),
    for_user_id: z.coerce.number().optional().describe('Evaluate security and data as a specific user ID.'),
    rel_limit: z.coerce.number().optional().default(20).describe('Limit the number of sub-lines or linked records resolved.'),
    with_translations: z.boolean().optional().default(false).describe('If True, translatable fields are returned in translation dictionary matrix.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
export const GetRecordsSchema = z.object({
    model: z.string().describe('Technical model name (used for all res_ids)'),
    res_ids: z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return [val];
            }
        }
        return val;
    }, z.array(z.coerce.number()).default([])).describe('JSON list of database IDs (e.g., "[1, 2]")'),
    xml_ids: z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return [val];
            }
        }
        return val;
    }, z.array(z.string()).default([])).describe('JSON list of XML IDs (e.g., \'["base.user_admin"]\')'),
    show_meta: z.boolean().optional().default(false).describe('Include system metadata.'),
    show_security: z.boolean().optional().default(false).describe('Perform real-time access checks.'),
    show_relationships: z.boolean().optional().default(false).describe('Resolve relational display names.'),
    show_extended: z.boolean().optional().default(false).describe('Include extension fields.'),
    show_computed: z.boolean().optional().default(false).describe('Include computed fields.'),
    show_related: z.boolean().optional().default(false).describe('Include related fields.'),
    show_lines: z.boolean().optional().default(false).describe('Resolve and include sub-line records.'),
    show_chatter: z.boolean().optional().default(false).describe('Include Odoo Chatter messages.'),
    include_binary: z.boolean().optional().default(false).describe('Include binary base64 data.'),
    show_all_fields: z.boolean().optional().default(false).describe('Force inclusion of EVERY field.'),
    for_user_id: z.coerce.number().optional().describe('Evaluate as a specific user ID.'),
    rel_limit: z.coerce.number().optional().default(20).describe('Limit the number of sub-lines/links resolved.'),
    with_translations: z.boolean().optional().default(false).describe('If True, translatable fields are returned in translation matrix.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Shared detail fetch orchestrator (equivalent to Python's _fetch_record).
 */
async function fetchSingleRecordDetail(client, instanceAlias, model, resId, flags) {
    // 1. Resolve and cache metadata
    const cache = MetadataCache.getInstance();
    let metadata = cache.get(instanceAlias, model);
    if (!metadata) {
        metadata = await buildModelMetadata(client, model, instanceAlias);
        cache.set(instanceAlias, model, metadata);
    }
    // Compile active columns to fetch
    const buckets = metadata.categorized;
    let activeFields = [...metadata.baseFields];
    if (flags.show_extended)
        activeFields.push(...Object.keys(buckets.extended));
    if (flags.show_computed)
        activeFields.push(...Object.keys(buckets.computed));
    if (flags.show_related)
        activeFields.push(...Object.keys(buckets.related));
    if (flags.show_relationships)
        activeFields.push(...Object.keys(buckets.relational));
    if (flags.show_lines)
        activeFields.push(...Object.keys(buckets.lines));
    if (flags.show_all_fields) {
        activeFields.push(...Object.keys(buckets.extended), ...Object.keys(buckets.computed), ...Object.keys(buckets.related), ...Object.keys(buckets.relational), ...Object.keys(buckets.lines));
    }
    // Deduplicate
    activeFields = Array.from(new Set(activeFields));
    // 2. Fetch Base Record
    const records = await client.executeKw(model, 'search_read', [[['id', '=', resId]]], {
        fields: activeFields,
        limit: 1
    });
    if (!records || records.length === 0)
        throw new Error(`Record ID ${resId} not found on ${model}`);
    const record = records[0];
    // 3. Resolve Translations if requested
    if (flags.with_translations) {
        const orchestrator = new OdooOrchestrator(client);
        const transFieldRecs = await client.executeKw('ir.model.fields', 'search_read', [[
                ['model_id.model', '=', model],
                ['name', 'in', activeFields],
                ['translate', '=', true]
            ]], { fields: ['name'] });
        const transFieldNames = transFieldRecs.map((f) => f.name);
        if (transFieldNames.length > 0) {
            const matrix = await orchestrator.fetchTranslationMatrix(model, [resId], transFieldNames);
            if (matrix[resId]) {
                Object.assign(record, matrix[resId]);
            }
        }
    }
    // 4. Resolve sub-line records (One2many / Many2many full sub-rows)
    if (flags.show_lines) {
        const lineFields = Object.keys(buckets.lines);
        for (const lf of lineFields) {
            const lineIds = record[lf];
            if (Array.isArray(lineIds) && lineIds.length > 0) {
                // Resolve lines metadata to get their baseFields
                const relationModel = buckets.lines[lf].relation || buckets.lines[lf].target;
                if (relationModel) {
                    let relMetadata = cache.get(instanceAlias, relationModel);
                    if (!relMetadata) {
                        relMetadata = await buildModelMetadata(client, relationModel, instanceAlias);
                        cache.set(instanceAlias, relationModel, relMetadata);
                    }
                    // Fetch full child data for lines
                    const childRecords = await client.executeKw(relationModel, 'search_read', [[['id', 'in', lineIds.slice(0, flags.rel_limit)]]], {
                        fields: relMetadata.baseFields
                    });
                    record[lf] = childRecords;
                }
            }
        }
    }
    // 5. Fetch Odoo Chatter messages
    if (flags.show_chatter) {
        try {
            const messages = await client.executeKw('mail.message', 'search_read', [[
                    ['model', '=', model],
                    ['res_id', '=', resId]
                ]], {
                fields: ['body', 'date', 'author_id', 'subtype_id'],
                limit: 5,
                order: 'date desc'
            });
            record._chatter = messages.map((m) => ({
                date: m.date,
                author: m.author_id ? m.author_id[1] : 'System',
                body: (m.body || '').replace(/<[^>]*>/g, '').trim() // Clean HTML tags
            }));
        }
        catch (e) {
            // Mail thread might not be inherited by this model
        }
    }
    // 6. Access Checks
    if (flags.show_security) {
        try {
            const access = await client.executeKw('ir.model.access', 'search_read', [[
                    ['model_id.model', '=', model]
                ]], {
                fields: ['perm_read', 'perm_write', 'perm_create', 'perm_unlink']
            });
            record._security = access.reduce((acc, a) => {
                acc.can_read = acc.can_read || a.perm_read;
                acc.can_write = acc.can_write || a.perm_write;
                acc.can_create = acc.can_create || a.perm_create;
                acc.can_unlink = acc.can_unlink || a.perm_unlink;
                return acc;
            }, { can_read: false, can_write: false, can_create: false, can_unlink: false });
        }
        catch (e) { }
    }
    // 7. Metadata (Creation/Write logs)
    if (flags.show_meta) {
        try {
            const meta = await client.executeKw(model, 'read', [[resId]], {
                fields: ['create_uid', 'create_date', 'write_uid', 'write_date']
            });
            if (meta && meta.length > 0) {
                record._metadata = {
                    created_by: meta[0].create_uid ? meta[0].create_uid[1] : 'Unknown',
                    created_on: meta[0].create_date,
                    modified_by: meta[0].write_uid ? meta[0].write_uid[1] : 'Unknown',
                    modified_on: meta[0].write_date,
                };
            }
        }
        catch (e) { }
    }
    // Scrub large binary payload placeholders if not include_binary
    if (!flags.include_binary) {
        for (const f of activeFields) {
            const fieldMeta = buckets.base[f] || buckets.extended[f] || buckets.computed[f] || buckets.related[f] || buckets.relational[f] || buckets.lines[f];
            if (fieldMeta && fieldMeta.type === 'binary' && record[f]) {
                record[f] = `<BINARY_DATA_HIDDEN>`;
            }
        }
    }
    return record;
}
/**
 * Resolve single record details.
 */
export async function getRecord(manager, input) {
    // Enforce schema parsing to apply default boolean flags and preprocessors
    const parsedInput = GetRecordSchema.parse(input);
    const { model, res_id, xml_id, instance_alias, ...flags } = parsedInput;
    const client = await manager.getClient(instance_alias);
    const alias = instance_alias || 'default';
    let targetModel = model;
    let targetId = res_id;
    // Resolve XML ID if provided
    if (xml_id) {
        const parts = xml_id.split('.');
        const modName = parts[0];
        const xmlName = parts[1] || '';
        const modelData = await client.executeKw('ir.model.data', 'search_read', [[
                ['module', '=', modName],
                ['name', '=', xmlName]
            ]], {
            fields: ['model', 'res_id'],
            limit: 1
        });
        if (!modelData || modelData.length === 0) {
            throw new Error(`XML ID not found: ${xml_id}`);
        }
        targetModel = modelData[0].model;
        targetId = modelData[0].res_id;
    }
    if (!targetModel || !targetId) {
        throw new Error('Must provide either model and res_id, or a valid xml_id.');
    }
    return await fetchSingleRecordDetail(client, alias, targetModel, targetId, flags);
}
/**
 * Resolve batch records details.
 */
export async function getRecords(manager, input) {
    const { model, res_ids = [], xml_ids = [], instance_alias, ...flags } = input;
    const client = await manager.getClient(instance_alias);
    const alias = instance_alias || 'default';
    const resolvedIds = [];
    // Gather database IDs
    for (const rid of res_ids) {
        resolvedIds.push({ id: rid });
    }
    // Resolve XML IDs in parallel
    if (xml_ids.length > 0) {
        for (const xid of xml_ids) {
            const parts = xid.split('.');
            const modName = parts[0];
            const xmlName = parts[1] || '';
            const modelData = await client.executeKw('ir.model.data', 'search_read', [[
                    ['module', '=', modName],
                    ['name', '=', xmlName]
                ]], {
                fields: ['res_id'],
                limit: 1
            });
            if (modelData && modelData.length > 0) {
                resolvedIds.push({ id: modelData[0].res_id, xmlId: xid });
            }
        }
    }
    // Fetch full details in parallel
    const batchResults = await Promise.all(resolvedIds.map(async (item) => {
        try {
            const detail = await fetchSingleRecordDetail(client, alias, model, item.id, flags);
            if (item.xmlId)
                detail._xml_id = item.xmlId;
            return detail;
        }
        catch (e) {
            return { id: item.id, _error: e.message || String(e) };
        }
    }));
    return batchResults;
}
//# sourceMappingURL=get_record.js.map