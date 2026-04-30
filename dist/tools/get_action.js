import { z } from 'zod';
/**
 * Zod schema for get_action tool input.
 * Includes pre-processing to handle numeric strings.
 */
export const GetActionSchema = z.object({
    action_id: z.coerce.number().describe('Database ID of the action (e.g., 123)'),
    action_type: z.string().default('ir.actions.act_window').describe('The technical type of the action.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to retrieve Odoo action details (e.g., act_window).
 * @param manager The InstanceManager instance.
 * @param input The GetActionInput parameters.
 * @returns Details of the Odoo action, including target model and views.
 */
export async function getAction(manager, input) {
    const { action_id, action_type, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const action = await client.executeKw(action_type, 'read', [[action_id]], {
        fields: [
            'name', 'res_model', 'view_mode', 'view_id',
            'domain', 'context', 'target', 'help'
        ],
    });
    if (!action || action.length === 0) {
        throw new Error(`Action not found: ${action_type} with ID ${action_id}`);
    }
    const act = action[0];
    return {
        id: action_id,
        name: act.name,
        res_model: act.res_model,
        view_mode: act.view_mode,
        view_id: act.view_id ? act.view_id[0] : null,
        domain: act.domain || '[]',
        context: act.context || '{}',
        target: act.target,
        help: act.help,
    };
}
//# sourceMappingURL=get_action.js.map