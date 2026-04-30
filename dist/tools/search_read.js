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
    limit: z.coerce.number().optional().describe('Maximum number of records to return'),
    offset: z.coerce.number().optional().describe('Number of records to skip (for pagination)'),
    order: z.string().optional().describe('Sort order (e.g., "id desc", "create_date asc")'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to search and read Odoo records.
 * @param manager The InstanceManager instance.
 * @param input The SearchReadInput parameters.
 * @returns An array of records matching the search criteria.
 */
export async function searchRead(manager, input) {
    const { model, domain, fields, limit, offset, order, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    return await client.executeKw(model, 'search_read', [domain], {
        fields,
        limit,
        offset,
        order,
    });
}
//# sourceMappingURL=search_read.js.map