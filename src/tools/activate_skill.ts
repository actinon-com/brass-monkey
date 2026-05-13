import { z } from 'zod';
import { SkillGuard } from '../services/skill-guard.js';

/**
 * Zod schema for activate_skill tool input.
 */
export const ActivateSkillSchema = z.object({
  skill_name: z.string().describe('The name of the domain skill to activate (e.g., "odoo-sales").'),
});

export type ActivateSkillInput = z.infer<typeof ActivateSkillSchema>;

/**
 * Tool to activate a domain-specific skill within the MCP session.
 * This unlocks access to the associated Odoo models.
 */
export async function activateSkill(guard: SkillGuard, input: ActivateSkillInput) {
  const { skill_name } = input;
  guard.activate(skill_name);
  
  return {
    status: 'success',
    message: `Skill '${skill_name}' activated. Access to associated Odoo models is now unlocked.`,
    active_skills: guard.getActivated()
  };
}
