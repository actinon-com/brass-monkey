import { z } from 'zod';
import { SkillGuard } from '../services/skill-guard.js';
/**
 * Zod schema for activate_skill tool input.
 */
export declare const ActivateSkillSchema: z.ZodObject<{
    skill_name: z.ZodString;
}, z.core.$strip>;
export type ActivateSkillInput = z.infer<typeof ActivateSkillSchema>;
/**
 * Tool to activate a domain-specific skill within the MCP session.
 * This unlocks access to the associated Odoo models.
 */
export declare function activateSkill(guard: SkillGuard, input: ActivateSkillInput): Promise<{
    status: string;
    message: string;
    active_skills: string[];
}>;
