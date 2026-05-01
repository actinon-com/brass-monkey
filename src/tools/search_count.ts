import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for search_count tool input.
 */
export const SearchCountSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "res.partner")'),
  domain: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }, z.array(z.any()).default([])).describe('Odoo domain filter (e.g., [["is_company", "=", true]])'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type SearchCountInput = z.infer<typeof SearchCountSchema>;

/**
 * Tool to get the total number of records matching a domain.
 * Lightweight alternative to search_read when only the count is needed.
 */
export async function searchCount(manager: InstanceManager, input: SearchCountInput) {
  const { model, domain, instance_alias } = input;
  const client = await manager.getClient(instance_alias);

  return await client.executeKw(model, 'search_count', [domain]);
}
