import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for search_read tool input.
 */
export const SearchReadSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "res.partner")'),
  domain: z.array(z.any()).default([]).describe('Odoo domain filter (e.g., [["state", "=", "sale"]])'),
  fields: z.array(z.string()).optional().describe('Fields to retrieve (empty = default fields)'),
  limit: z.number().optional().describe('Maximum number of records to return'),
  offset: z.number().optional().describe('Number of records to skip (for pagination)'),
  order: z.string().optional().describe('Sort order (e.g., "id desc", "create_date asc")'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type SearchReadInput = z.infer<typeof SearchReadSchema>;

/**
 * Tool to search and read Odoo records.
 * @param manager The InstanceManager instance.
 * @param input The SearchReadInput parameters.
 * @returns An array of records matching the search criteria.
 */
export async function searchRead(manager: InstanceManager, input: SearchReadInput) {
  const { model, domain, fields, limit, offset, order, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  
  return await client.executeKw(model, 'search_read', [domain], {
    fields,
    limit,
    offset,
    order,
  });
}
