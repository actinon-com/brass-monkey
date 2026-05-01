import { z } from 'zod';
/**
 * Zod schema for search_read tool input.
 * Includes pre-processing to be more forgiving of agent formatting errors.
 */
export const SearchReadSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    domain: z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return val;
            }
        }
        return val;
    }, z.array(z.any()).default([])).describe('Odoo domain filter (e.g., [["state", "=", "sale"]])'),
    fields: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.startsWith('[')) {
                try {
                    return JSON.parse(val);
                }
                catch {
                    return [val];
                }
            }
            return [val];
        }
        return val;
    }, z.array(z.string()).optional()).describe('Fields to retrieve (empty = default fields)'),
    include_extended: z.boolean().optional().default(false).describe("Include fields from extension modules if 'fields' is empty."),
    include_computed: z.boolean().optional().default(false).describe("Include non-stored/calculated fields if 'fields' is empty."),
    limit: z.coerce.number().optional().describe('Maximum number of records to return'),
    offset: z.coerce.number().optional().describe('Number of records to skip (for pagination)'),
    order: z.string().optional().describe('Sort order (e.g., "id desc", "create_date asc")'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to search and read Odoo records.
 * Automatically handles field categorization to prevent context window flooding.
 */
export async function searchRead(manager, input) {
    const { model, domain = [], fields, include_extended, include_computed, limit, offset, order, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    let readFields = fields;
    // If no fields specified, perform auto-categorization
    if (!readFields || readFields.length === 0) {
        // 1. Resolve Model and its Base Module
        const modelInfo = await client.executeKw('ir.model', 'search_read', [[['model', '=', model]]], {
            fields: ['modules'],
            limit: 1
        });
        if (modelInfo && modelInfo.length > 0) {
            const baseModule = modelInfo[0].modules.split(',')[0].trim();
            // 2. Fetch Fields and Filter
            const fRecords = await client.executeKw('ir.model.fields', 'search_read', [[['model_id.model', '=', model]]], {
                fields: ['name', 'modules', 'compute']
            });
            const categorizedFields = fRecords.filter((f) => {
                const isBase = f.modules.includes(baseModule);
                if (isBase)
                    return true;
                if (include_extended)
                    return true; // Include non-base if requested
                if (include_computed && f.compute)
                    return true; // Include computed if requested
                return false;
            }).map((f) => f.name);
            // Ensure essential fields are present
            if (!categorizedFields.includes('id'))
                categorizedFields.push('id');
            if (!categorizedFields.includes('display_name')) {
                // Try to add display_name if it exists in the model
                const hasDisplayName = fRecords.some((f) => f.name === 'display_name');
                if (hasDisplayName)
                    categorizedFields.push('display_name');
            }
            readFields = categorizedFields;
        }
    }
    return await client.executeKw(model, 'search_read', [domain], {
        fields: readFields,
        limit,
        offset,
        order,
    });
}
//# sourceMappingURL=search_read.js.map