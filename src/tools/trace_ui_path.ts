import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for trace_ui_path tool input.
 */
export const TraceUiPathSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "sale.order")'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type TraceUiPathInput = z.infer<typeof TraceUiPathSchema>;

/**
 * Tool to trace the UI path (Menus -> Actions -> Views) for a technical model.
 * Helps the agent understand how a user visually accesses specific data.
 */
export async function traceUiPath(manager: InstanceManager, input: TraceUiPathInput) {
  const parsedInput = TraceUiPathSchema.parse(input);
  const { model, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);

  // 1. Find Window Actions for this model
  const actions = await client.executeKw('ir.actions.act_window', 'search_read', [[['res_model', '=', model]]], {
    fields: ['name', 'view_mode', 'context', 'domain', 'xml_id']
  });

  const paths = [];

  for (const action of actions) {
    // 2. Find Menus linked to each action
    // Odoo stores action as 'ir.actions.act_window,ID' in the menu
    const actionStr = `ir.actions.act_window,${action.id}`;
    const menus = await client.executeKw('ir.ui.menu', 'search_read', [[['action', '=', actionStr]]], {
      fields: ['complete_name']
    });

    for (const menu of menus) {
      paths.push({
        menu_path: menu.complete_name,
        action_name: action.name,
        action_xmlid: action.xml_id || undefined,
        view_mode: action.view_mode,
        context: action.context,
        domain: action.domain
      });
    }
  }

  if (paths.length === 0) {
    return `No UI entry points (Menus/Actions) found for model '${model}'. It might be a technical model or managed via relations only.`;
  }

  return {
    summary: `Found ${paths.length} UI path(s) for model '${model}'.`,
    paths: paths
  };
}
