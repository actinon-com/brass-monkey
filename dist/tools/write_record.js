import { z } from 'zod';
/**
 * Zod schema for write_record tool input.
 * Includes pre-processing to handle numeric strings and JSON-serialized values.
 */
export const WriteRecordSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
    id: z.coerce.number().describe('Database ID of the record to update.'),
    values: z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return val;
            }
        }
        return val;
    }, z.record(z.string(), z.any())).describe('A dictionary of fields to update.'),
    justification: z.string().min(1).describe('Business justification for the change.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to update an existing Odoo record with snapshot-based reversibility.
 * @param manager The InstanceManager instance.
 * @param input The WriteRecordInput parameters.
 * @returns Boolean true on success.
 */
export async function writeRecord(manager, input) {
    const { model, id, values, justification, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const audit = await manager.getAudit(instance_alias);
    // 1. Capture "Before Snapshot" for reversibility
    const fieldsToCapture = Object.keys(values);
    const beforeRecords = await client.executeKw(model, 'read', [[id]], { fields: fieldsToCapture });
    const before = beforeRecords && beforeRecords.length > 0 ? beforeRecords[0] : {};
    // 2. Execute the write
    const success = await client.executeKw(model, 'write', [[id], values]);
    // 3. Audit and store reversibility context in Chatter
    if (success) {
        const body = audit.formatWriteSnapshot(before, justification);
        await audit.postChatterMessage(model, id, body);
        await audit.logSystemEvent(`Modified ${model}(${id}): ${justification}`);
    }
    return success;
}
//# sourceMappingURL=write_record.js.map