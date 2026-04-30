import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for list_models tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export const ListModelsSchema = z.object({
  search_term: z.preprocess((val) => {
    if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
      return val[0];
    }
    return val;
  }, z.string().optional()).describe('Optional filter for model name or description (e.g., "sale")'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type ListModelsInput = z.infer<typeof ListModelsSchema>;

/**
 * Tool to list Odoo technical models.
 * @param manager The InstanceManager instance.
 * @param input The ListModelsInput parameters.
 * @returns A map of model technical names to human-readable descriptions.
 */
export async function listModels(manager: InstanceManager, input: ListModelsInput = {}) {
  const { search_term, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  
  const domain: any[] = [];
  if (search_term) {
    domain.push('|', ['model', 'ilike', search_term], ['name', 'ilike', search_term]);
  }

  const models = await client.executeKw('ir.model', 'search_read', [domain], {
    fields: ['model', 'name'],
    order: 'model asc',
  });

  const result: Record<string, string> = {};
  for (const m of models) {
    result[m.model] = m.name;
  }

  return result;
}
