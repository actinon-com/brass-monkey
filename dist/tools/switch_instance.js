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
    await manager.getClient(alias);
    manager.setDefault(alias);
    return `Instance switched to '${alias}'. All subsequent Odoo tool calls will use this instance unless 'instance_alias' is explicitly provided.`;
}
//# sourceMappingURL=switch_instance.js.map