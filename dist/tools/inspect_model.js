import { z } from 'zod';
/**
 * Zod schema for inspect_model tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export const InspectModelSchema = z.object({
    model: z.preprocess((val) => {
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
            return val[0];
        }
        return val;
    }, z.string()).describe('Technical model name (e.g., "res.partner")'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to inspect an Odoo model with "Lean Property Encoding".
 * @param manager The InstanceManager instance.
 * @param input The InspectModelInput parameters.
 * @returns An optimized map of model fields and their technical attributes.
 */
export async function inspectModel(manager, input) {
    const { model, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const rawFields = await client.executeKw(model, 'fields_get', [], {
        attributes: [
            'type', 'string', 'help', 'relation', 'relation_field',
            'domain', 'selection', 'required', 'readonly',
            'store', 'company_dependent'
        ],
    });
    const optimized = {};
    for (const [fieldName, fieldData] of Object.entries(rawFields)) {
        const properties = [];
        // Compress behavioral flags into the "properties" array
        if (fieldData.required)
            properties.push('required');
        if (fieldData.readonly)
            properties.push('readonly');
        if (fieldData.company_dependent)
            properties.push('company-dependent');
        if (fieldData.store === false)
            properties.push('not-stored');
        optimized[fieldName] = {
            type: fieldData.type,
            string: fieldData.string,
            help: fieldData.help || undefined,
            relation: fieldData.relation || undefined,
            relation_field: fieldData.relation_field || undefined,
            domain: fieldData.domain || undefined,
            selection: fieldData.selection || undefined,
            properties: properties.length > 0 ? properties : undefined,
        };
    }
    return optimized;
}
//# sourceMappingURL=inspect_model.js.map