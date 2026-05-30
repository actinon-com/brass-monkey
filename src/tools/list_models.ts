import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { SKILL_DOMAIN_MAP } from '../services/skill-guard.js';

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
  limit: z.coerce.number().optional().default(50).describe('Maximum number of models to return (defaults to 50)'),
  offset: z.coerce.number().optional().default(0).describe('Number of models to skip (for pagination)'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type ListModelsInput = z.infer<typeof ListModelsSchema>;

/**
 * Tool to list Odoo technical models.
 * Enhances the output with Skill Gate breadcrumbs to guide the agent.
 */
export async function listModels(manager: InstanceManager, input: ListModelsInput = { limit: 50, offset: 0 }) {
  // Enforce schema parsing to apply defaults and preprocessors
  const parsedInput = ListModelsSchema.parse(input);
  const { search_term, limit, offset, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);
  
  const domain: any[] = [];
  if (search_term) {
    domain.push('|', ['model', 'ilike', search_term], ['name', 'ilike', search_term]);
  }

  const models = await client.executeKw('ir.model', 'search_read', [domain], {
    fields: ['model', 'name', 'transient'],
    order: 'model asc',
  });

  const results = models.map((m: any) => {
    // Resolve required skill for breadcrumb
    let requiredSkill = null;
    for (const [skill, prefixes] of Object.entries(SKILL_DOMAIN_MAP)) {
      for (const prefix of prefixes) {
        const regex = new RegExp('^' + prefix.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        if (regex.test(m.model)) {
          requiredSkill = skill;
          break;
        }
      }
      if (requiredSkill) break;
    }

    return {
      model: m.model,
      name: m.name,
      transient: m.transient,
      required_skill: requiredSkill
    };
  });

  const paginatedResults = results.slice(offset, offset + limit);

  return {
    search_term: search_term || undefined,
    count: paginatedResults.length,
    total_count: results.length,
    offset,
    limit,
    results: paginatedResults
  };
}
