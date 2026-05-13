/**
 * Registry of Expert Domains and their associated Odoo model prefixes.
 * Derived from the Brass-Monkey Skill Gate Specification.
 */
export const SKILL_DOMAIN_MAP = {
    'odoo-sales': ['sale.*', 'crm.team', 'res.partner', 'product.pricelist'],
    'odoo-finance': ['account.*', 'res.currency', 'payment.*', 'res.bank', 'res.partner.bank'],
    'odoo-inventory': ['stock.*', 'product.*', 'uom.*', 'delivery.*'],
    'odoo-mrp': ['mrp.*'],
    'odoo-projects': ['project.*', 'account.analytic.line', 'fsm.*'],
    'odoo-crm': ['crm.lead', 'crm.stage', 'crm.tag', 'crm.lost.reason'],
    'odoo-hr': ['hr.*', 'resource.*'],
    'odoo-helpdesk': ['helpdesk.*'],
    'odoo-attendance': ['hr.attendance'],
    'odoo-documents': ['documents.*'],
    'odoo-knowledge': ['knowledge.*'],
    'odoo-quality': ['quality.*'],
    'odoo-purchasing': ['purchase.*'],
    'odoo-plm': ['mrp.eco.*', 'mrp.bom.*'],
    'odoo-field-service': ['project.task', 'fsm.*'],
    'odoo-website': ['website.*'],
    'odoo-worksheets': ['worksheet.template', 'x_custom.worksheet.*'],
    'odoo-spreadsheets': ['documents_spreadsheet.*', 'spreadsheet.*'],
    'odoo-security': ['res.groups', 'res.users', 'ir.model.access', 'ir.rule'],
    'odoo-ux': ['ir.ui.view', 'ir.ui.menu', 'ir.actions.*'],
    'odoo-relations': ['res.partner', 'res.partner.category', 'res.partner.title'],
    'odoo-products': ['product.template', 'product.product', 'product.category', 'product.attribute.*'],
};
/**
 * Tools that are exempted from the Skill Gate to allow for discovery.
 */
export const EXEMPT_TOOLS = [
    'setup_instance',
    'list_instances',
    'switch_instance',
    'remove_instance',
    'list_models',
    'get_info',
    'get_environment',
    'get_audit_log',
    'activate_skill' // The key that unlocks the gate
];
/**
 * Service to manage and enforce domain-specific skill activation.
 */
export class SkillGuard {
    activatedSkills = new Set();
    /**
     * Activates a skill for the current session.
     */
    activate(skillName) {
        this.activatedSkills.add(skillName);
    }
    /**
     * Returns the set of currently activated skills.
     */
    getActivated() {
        return Array.from(this.activatedSkills);
    }
    /**
     * Resolves which skill is required for a given Odoo model.
     * Uses regex matching against the domain map.
     */
    getRequiredSkill(model) {
        for (const [skill, prefixes] of Object.entries(SKILL_DOMAIN_MAP)) {
            for (const prefix of prefixes) {
                const regex = new RegExp('^' + prefix.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                if (regex.test(model)) {
                    return skill;
                }
            }
        }
        return null;
    }
    /**
     * Validates if the required skill for a model is active.
     * @throws Error if the domain is locked.
     */
    validateAccess(toolName, args) {
        if (EXEMPT_TOOLS.includes(toolName))
            return;
        const model = args?.model;
        if (!model)
            return;
        const requiredSkill = this.getRequiredSkill(model);
        if (requiredSkill && !this.activatedSkills.has(requiredSkill)) {
            throw new Error(`DOMAIN_LOCKED: Access to model '${model}' is locked. You must first activate the '${requiredSkill}' skill to internalize the expert domain rules for this operation.`);
        }
    }
}
//# sourceMappingURL=skill-guard.js.map