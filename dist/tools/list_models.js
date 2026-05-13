import { z } from 'zod';
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
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to list Odoo technical models.
 * Enhances the output with Skill Gate breadcrumbs to guide the agent.
 */
export async function listModels(manager, input = {}) {
    const { search_term, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const domain = [];
    if (search_term) {
        domain.push('|', ['model', 'ilike', search_term], ['name', 'ilike', search_term]);
    }
    const models = await client.executeKw('ir.model', 'search_read', [domain], {
        fields: ['model', 'name', 'transient'],
        order: 'model asc',
    });
    return models.map((m) => {
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
            if (requiredSkill)
                break;
        }
        return {
            model: m.model,
            name: m.name,
            transient: m.transient,
            required_skill: requiredSkill
        };
    });
}
//# sourceMappingURL=list_models.js.map