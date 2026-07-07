import { z } from 'zod';
/**
 * Zod schema for get_view tool input.
 * Includes pre-processing to handle numeric strings.
 */
export const GetViewSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    view_type: z.enum(['form', 'tree', 'kanban', 'search', 'calendar', 'pivot', 'graph']).describe('Type of the view to retrieve.'),
    view_id: z.coerce.number().optional().describe('Optional specific view ID.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to retrieve Odoo view architecture.
 * @param manager The InstanceManager instance.
 * @param input The GetViewInput parameters.
 * @returns The view architecture (XML) and metadata.
 */
export async function getView(manager, input) {
    const parsedInput = GetViewSchema.parse(input);
    const { model, view_type, view_id, instance_alias } = parsedInput;
    const client = await manager.getClient(instance_alias);
    // Odoo 16+ uses get_view, earlier versions use fields_view_get
    const method = (client.majorVersion || 0) >= 16 ? 'get_view' : 'fields_view_get';
    const result = await client.executeKw(model, method, [], {
        view_id: view_id,
        view_type: view_type,
    });
    return {
        model: model,
        view_type: view_type,
        view_id: result.view_id || view_id,
        arch: result.arch,
        fields: result.fields, // Contains visible fields metadata
    };
}
//# sourceMappingURL=get_view.js.map