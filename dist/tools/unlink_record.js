import { z } from 'zod';
/**
 * Zod schema for unlink_record tool input.
 * Includes pre-processing to handle numeric strings.
 */
export const UnlinkRecordSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    id: z.coerce.number().describe('Database ID of the record to delete.'),
    justification: z.string().min(1).describe('Business justification for deleting this record.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to delete (unlink) an Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The UnlinkRecordInput parameters.
 * @returns Boolean true on success.
 */
export async function unlinkRecord(manager, input) {
    const { model, id, justification, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const audit = await manager.getAudit(instance_alias);
    const success = await client.executeKw(model, 'unlink', [[id]]);
    // Log locally and to global system logs
    if (success) {
        await audit.logLocalAction('unlink', model, id, null, justification);
        await audit.logSystemEvent(`Deleted ${model}(${id}): ${justification}`, 'warning');
    }
    return success;
}
//# sourceMappingURL=unlink_record.js.map