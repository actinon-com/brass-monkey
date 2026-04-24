import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for unlink_record tool input.
 */
export const UnlinkRecordSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "res.partner")'),
  id: z.number().describe('Database ID of the record to delete.'),
  justification: z.string().min(1).describe('Business justification for deleting this record.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type UnlinkRecordInput = z.infer<typeof UnlinkRecordSchema>;

/**
 * Tool to delete (unlink) an Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The UnlinkRecordInput parameters.
 * @returns Boolean true on success.
 */
export async function unlinkRecord(manager: InstanceManager, input: UnlinkRecordInput) {
  const { model, id, justification, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  const audit = await manager.getAudit(instance_alias);
  
  const success = await client.executeKw(model, 'unlink', [[id]]);

  // Log to global system logs
  if (success) {
    await audit.logSystemEvent(`Deleted ${model}(${id}): ${justification}`, 'warning');
  }

  return success;
}
