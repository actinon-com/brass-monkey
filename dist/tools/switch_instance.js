import { z } from 'zod';
/**
 * Zod schema for switch_instance tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export const SwitchInstanceSchema = z.object({
    alias: z.preprocess((val) => {
        if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
            return val[0];
        }
        return val;
    }, z.string()).describe('The name of the Odoo instance to make active for the rest of the session.'),
});
/**
 * Tool to set the default Odoo instance for the current session.
 * @param manager The InstanceManager instance.
 * @param input The SwitchInstanceInput parameters.
 * @returns Success message.
 */
export async function switchInstance(manager, input) {
    const { alias } = input;
    // Verify it exists by trying to get it
    const client = await manager.getClient(alias);
    // Eagerly authenticate so credentials validate now and the company scope is
    // known at the switch point — the agent should not have to call get_environment
    // just to learn whether this instance is single- or multi-company. Do this
    // BEFORE flipping the default, so a failed switch does not strand the session
    // pointing at an instance that cannot authenticate.
    if (!client.activeUid) {
        await client.authenticate();
    }
    manager.setDefault(alias);
    const scope = client.isMultiCompany
        ? `MULTI-COMPANY (${client.accessibleCompanyIds.length} accessible companies)`
        : `SINGLE-COMPANY`;
    return `Instance switched to '${alias}'. Scope: ${scope}. All subsequent Odoo tool calls will use this instance unless 'instance_alias' is explicitly provided.`;
}
//# sourceMappingURL=switch_instance.js.map