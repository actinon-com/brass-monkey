/**
 * Registry of Expert Domains and their associated Odoo model prefixes.
 * Derived from the Brass-Monkey Skill Gate Specification.
 */
export declare const SKILL_DOMAIN_MAP: Record<string, string[]>;
/**
 * Tools that are exempted from the Skill Gate to allow for discovery.
 */
export declare const EXEMPT_TOOLS: string[];
/**
 * Service to manage and enforce domain-specific skill activation.
 */
export declare class SkillGuard {
    private activatedSkills;
    /**
     * Activates a skill for the current session.
     */
    activate(skillName: string): void;
    /**
     * Returns the set of currently activated skills.
     */
    getActivated(): string[];
    /**
     * Resolves which skill is required for a given Odoo model.
     * Uses regex matching against the domain map.
     */
    getRequiredSkill(model: string): string | null;
    /**
     * Validates if the required skill for a model is active.
     * @throws Error if the domain is locked.
     */
    validateAccess(toolName: string, args: any): void;
}
