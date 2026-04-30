import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_menu tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export const GetMenuSchema = z.object({
  search_term: z.preprocess((val) => {
    if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
      return val[0];
    }
    return val;
  }, z.string().optional()).describe('Optional filter for menu name (e.g., "Sales")'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type GetMenuInput = z.infer<typeof GetMenuSchema>;

/**
 * Tool to retrieve Odoo menu hierarchy.
 * @param manager The InstanceManager instance.
 * @param input The GetMenuInput parameters.
 * @returns An array of menu items with their complete names and associated actions.
 */
export async function getMenu(manager: InstanceManager, input: GetMenuInput = {}) {
  const { search_term, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  
  const domain: any[] = [];
  if (search_term) {
    domain.push(['name', 'ilike', search_term]);
  }

  const menus = await client.executeKw('ir.ui.menu', 'search_read', [domain], {
    fields: ['id', 'complete_name', 'action', 'parent_id'],
  });

  const result = menus.map((m: any) => ({
    id: m.id,
    name: m.complete_name,
    action: m.action ? {
      id: parseInt(m.action.split(',')[0]),
      type: m.action.split(',')[1],
    } : null,
    parent_id: m.parent_id ? m.parent_id[0] : null,
  }));

  // Sort by complete name in memory
  return result.sort((a: any, b: any) => a.name.localeCompare(b.name));
}
