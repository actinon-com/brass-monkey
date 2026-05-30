import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_menu tool input.
 */
export const GetMenuSchema = z.object({
  parent_id: z.preprocess((val) => {
    if (val === 'false' || val === 'False') return null;
    return val;
  }, z.coerce.number().nullable().optional()).describe('Optional parent menu ID to drill down hierarchically.'),
  search_term: z.preprocess((val) => {
    if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
      return val[0];
    }
    return val;
  }, z.string().optional()).describe('Optional semantic filter (e.g., "Currencies"). Returns a highly pruned, clean ancestral tree path directly to the match.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type GetMenuInput = z.infer<typeof GetMenuSchema>;

interface MenuNode {
  id: number;
  name: string;
  complete_name?: string;
  action: { id: number; type: string } | null;
  parent_id: number | null;
  children: MenuNode[];
  children_count?: number;
}

/**
 * Helper to parse Odoo's reference-type action field ("model,id" format)
 */
function parseOdooAction(actionStr: any): { id: number; type: string } | null {
  if (actionStr && typeof actionStr === 'string' && actionStr.includes(',')) {
    const parts = actionStr.split(',');
    // Odoo's reference field format is "ir.actions.act_window,66" (model first, then ID)
    const type = parts[0].trim();
    const id = parseInt(parts[1].trim(), 10);
    if (!isNaN(id)) {
      return { id, type };
    }
  }
  return null;
}

/**
 * Build a recursive tree from a flat list of nodes
 */
function buildTree(nodes: any[], parentId: number | null = null, maxDepth: number = 99, currentDepth: number = 0): MenuNode[] {
  if (currentDepth > maxDepth) return [];
  
  const tree: MenuNode[] = [];
  const levelNodes = nodes.filter(n => n.parent_id === parentId);

  // Sort by sequence or complete_name
  levelNodes.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  for (const n of levelNodes) {
    const children = buildTree(nodes, n.id, maxDepth, currentDepth + 1);
    tree.push({
      id: n.id,
      name: n.name,
      complete_name: n.complete_name || undefined,
      action: parseOdooAction(n.action),
      parent_id: n.parent_id,
      children_count: n.children_count || children.length,
      children
    });
  }

  return tree;
}

/**
 * Tool to retrieve Odoo menu hierarchy.
 * Generates an extremely dense, pruned recursive JSON tree for both search and navigation.
 */
export async function getMenu(manager: InstanceManager, input: GetMenuInput = {}) {
  // Enforce schema parsing to apply defaults and preprocessors
  const parsedInput = GetMenuSchema.parse(input);
  const { parent_id, search_term, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);

  // Fetch all active menus to build the in-memory tree (lightweight columns only)
  const menus = await client.executeKw('ir.ui.menu', 'search_read', [[]], {
    fields: ['id', 'name', 'complete_name', 'action', 'parent_id', 'sequence', 'child_id'],
  });

  // Map to simple nodes
  const flatNodes = menus.map((m: any) => ({
    id: m.id,
    name: m.name,
    complete_name: m.complete_name,
    action: m.action,
    parent_id: m.parent_id ? m.parent_id[0] : null,
    sequence: m.sequence || 0,
    children_count: Array.isArray(m.child_id) ? m.child_id.length : 0,
  }));

  let filteredNodes = flatNodes;

  if (search_term) {
    // Mode A: Pruned Search Tree with Local Neighborhood Context (Ancestors + Siblings + Children)
    // 1. Find matches for the search term
    const term = search_term.toLowerCase();
    const matches = flatNodes.filter((n: any) => 
      (n.name || '').toLowerCase().includes(term) || 
      (n.complete_name || '').toLowerCase().includes(term)
    );

    // 2. Resolve Ancestors, Siblings, and Children IDs for each match to build a rich Local Map
    const keepIds = new Set<number>();
    for (const m of matches) {
      // A. Add match itself
      keepIds.add(m.id);

      // B. Add direct siblings of the match (sharing the same parent_id)
      const siblings = flatNodes.filter((n: any) => n.parent_id === m.parent_id);
      for (const sib of siblings) {
        keepIds.add(sib.id);
      }

      // C. Add direct children of the match (sub-menus)
      const children = flatNodes.filter((n: any) => n.parent_id === m.id);
      for (const child of children) {
        keepIds.add(child.id);
      }

      // D. Walk up parent chain to resolve ancestors breadcrumb path (grandparent branches remain tightly pruned)
      let current = flatNodes.find((n: any) => n.id === m.parent_id);
      while (current) {
        keepIds.add(current.id);
        current = flatNodes.find((n: any) => n.id === current.parent_id);
      }
    }

    // 3. Keep ONLY the matching lineage, sibling, and child nodes
    filteredNodes = flatNodes.filter((n: any) => keepIds.has(n.id));
    
    // Build tree starting from root (parent_id = null)
    const prunedTree = buildTree(filteredNodes, null);
    
    return {
      search_term,
      count: matches.length,
      results: prunedTree
    };
  } else {
    // Mode B: Hierarchical Drilling
    if (parent_id !== undefined && parent_id !== null) {
      // Return 2-level subtree of selected parent
      const subTree = buildTree(flatNodes, parent_id, 1);
      return {
        parent_id,
        count: subTree.length,
        results: subTree
      };
    } else {
      // Default: Return root App folders with their 1st-level children (extremely clean root dashboard)
      const rootTree = buildTree(flatNodes, null, 1);
      return {
        count: rootTree.length,
        results: rootTree
      };
    }
  }
}
