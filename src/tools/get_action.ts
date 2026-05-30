import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_action tool input.
 * Includes pre-processing to handle numeric strings.
 */
export const GetActionSchema = z.object({
  action_id: z.coerce.number().describe('Database ID of the action (e.g., 123)'),
  action_type: z.string().optional().describe('The technical type of the action (optional, auto-resolved if omitted).'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type GetActionInput = z.infer<typeof GetActionSchema>;

/**
 * Tool to retrieve Odoo action details (e.g., act_window, server actions).
 * Automatically resolves the correct Odoo actions model dynamically to prevent crashes.
 */
export async function getAction(manager: InstanceManager, input: GetActionInput) {
  // Enforce schema parsing to apply defaults and preprocessors
  const parsedInput = GetActionSchema.parse(input);
  const { action_id, action_type, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);

  let resolvedModel = action_type;

  // 1. If action_type is omitted, dynamically resolve the actual model using ir.actions.actions
  if (!resolvedModel) {
    const actionMeta = await client.executeKw('ir.actions.actions', 'read', [[action_id]], {
      fields: ['type']
    });
    if (!actionMeta || actionMeta.length === 0) {
      throw new Error(`Action not found with ID ${action_id}`);
    }
    resolvedModel = actionMeta[0].type; // e.g. 'ir.actions.server' or 'ir.actions.act_window'
  }

  const modelToQuery: string = resolvedModel || 'ir.actions.act_window';

  // 2. Select columns to read based on the resolved action model
  const fieldsToRead = ['name', 'type', 'help'];
  if (modelToQuery === 'ir.actions.act_window') {
    fieldsToRead.push('res_model', 'view_mode', 'view_id', 'domain', 'context', 'target');
  } else if (modelToQuery === 'ir.actions.server') {
    fieldsToRead.push('model_id', 'state');
  }

  const action = await client.executeKw(modelToQuery, 'read', [[action_id]], {
    fields: fieldsToRead,
  });

  if (!action || action.length === 0) {
    throw new Error(`Action not found: ${modelToQuery} with ID ${action_id}`);
  }

  const act = action[0];

  return {
    id: action_id,
    type: modelToQuery,
    name: act.name,
    res_model: act.res_model || undefined,
    view_mode: act.view_mode || undefined,
    view_id: act.view_id ? act.view_id[0] : undefined,
    domain: act.domain || undefined,
    context: act.context || undefined,
    target: act.target || undefined,
    state: act.state || undefined,
    model_id: act.model_id ? act.model_id[1] : undefined,
    help: act.help || undefined,
  };
}
