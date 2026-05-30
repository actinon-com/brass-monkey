import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_menu tool input.
 */
export const GetMenuSchema = z.object({
  parent_id: z.preprocess((val) => {
    if (val === 'false' || val === 'False') return null;
    return val;
  }, z.coerce.number().nullable().optional()).describe('Optional parent menu ID. If omitted and search_term is blank, returns top-level apps.'),
  search_term: z.preprocess((val) => {
    if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
      return val[0];
    }
    return val;
  }, z.string().optional()).describe('Optional semantic filter for menu name (e.g., "Sales").'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type GetMenuInput = z.infer<typeof GetMenuSchema>;

/**
 * Tool to retrieve Odoo menu hierarchy.
 * Supports hierarchical parent drilling and full ancestral path search.
 */
export async function getMenu(manager: InstanceManager, input: GetMenuInput = {}) {
  // Enforce schema parsing to apply defaults and preprocessors
  const parsedInput = GetMenuSchema.parse(input);
  const { parent_id, search_term, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);
  
  const domain: any[] = [];
  
  // 1. Core Logic: Breadth-First Gated Routing
  if (search_term) {
    // Mode A: Semantic Search
    domain.push('|', ['name', 'ilike', search_term], ['complete_name', 'ilike', search_term]);
  } else {
    // Mode B: Hierarchical drilling
    if (parent_id !== undefined && parent_id !== null) {
      domain.push(['parent_id', '=', parent_id]);
    } else {
      domain.push(['parent_id', '=', false]); // Top-level apps only (prevents 1,000+ item dump)
    }
  }

  const menus = await client.executeKw('ir.ui.menu', 'search_read', [domain], {
    fields: ['id', 'name', 'complete_name', 'action', 'parent_id', 'child_id'],
  });

  const results = menus.map((m: any) => {
    let act = null;
    if (m.action && typeof m.action === 'string' && m.action.includes(',')) {
      const parts = m.action.split(',');
      act = {
        id: parseInt(parts[0]),
        type: parts[1],
      };
    }

    return {
      id: m.id,
      name: m.name,
      complete_name: m.complete_name || m.name, // Ancestor path (e.g., "Sales / Orders / Quotations")
      action: act,
      parent_id: m.parent_id ? m.parent_id[0] : null,
      has_children: Array.isArray(m.child_id) && m.child_id.length > 0,
      children_count: Array.isArray(m.child_id) ? m.child_id.length : 0,
    };
  });

  // Sort by complete name in memory for clean presentation
  results.sort((a: any, b: any) => a.complete_name.localeCompare(b.complete_name));

  return {
    parent_id: parent_id || undefined,
    search_term: search_term || undefined,
    count: results.length,
    results
  };
}
