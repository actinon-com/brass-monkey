import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for create_record tool input.
 * Includes pre-processing to handle JSON-serialized values.
 */
export const CreateRecordSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "res.partner")'),
  values: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }, z.record(z.string(), z.any())).describe('A dictionary of field values.'),
  justification: z.string().min(1).describe('Business justification for creating this record.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;

/**
 * Tool to create a new Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The CreateRecordInput parameters.
 * @returns The database ID of the newly created record.
 */
export async function createRecord(manager: InstanceManager, input: CreateRecordInput) {
  const { model, values, justification, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  const audit = await manager.getAudit(instance_alias);
  
  const recordId = await client.executeKw(model, 'create', [values]);

  // Log to global system logs
  await audit.logSystemEvent(`Created ${model}(${recordId}): ${justification}`);

  // Log to chatter (if supported by model)
  await audit.postChatterMessage(model, recordId as number, `<p>Created record with justification: ${justification}</p>`);

  return recordId;
}
