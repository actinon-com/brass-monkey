import { z } from 'zod';
import { OdooOrchestrator } from '../services/odoo-orchestrator.js';
/**
 * Zod schema for create_record tool input.
 * Includes pre-processing to handle JSON-serialized values.
 */
export const CreateRecordSchema = z.object({
    model: z.string().describe('Technical model name (e.g., "res.partner")'),
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
    }, z.record(z.string(), z.any())).describe('A dictionary of field values.'),
    justification: z.string().min(1).describe('Business justification for creating this record.'),
    with_translations: z.boolean().optional().default(false).describe("If True, translatable fields can be provided as strings (sync to all) or expanded lists."),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to create a new Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The CreateRecordInput parameters.
 * @returns The database ID of the newly created record.
 */
export async function createRecord(manager, input) {
    const { model, values, justification, with_translations, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const audit = await manager.getAudit(instance_alias);
    const orchestrator = new OdooOrchestrator(client);
    // Identify translatable fields if flag is set
    let transFieldNames = [];
    if (with_translations) {
        const transFieldRecs = await client.executeKw('ir.model.fields', 'search_read', [[
                ['model_id.model', '=', model],
                ['name', 'in', Object.keys(values)],
                ['translate', '=', true]
            ]], { fields: ['name'] });
        transFieldNames = transFieldRecs.map((f) => f.name);
    }
    // Resolve natural language values (names to IDs, objects to command tuples)
    const resolvedValues = await orchestrator.resolveFieldValues(model, values);
    const recordId = await orchestrator.applyBroadcastWrite(model, null, resolvedValues, transFieldNames);
    // Log locally for agent history
    await audit.logLocalAction('create', model, recordId, resolvedValues, justification);
    // Log to global system logs
    await audit.logSystemEvent(`Created ${model}(${recordId}): ${justification}`);
    // Log to chatter (if supported by model)
    await audit.postChatterMessage(model, recordId, `<p>Created record with justification: ${justification}</p>`);
    return recordId;
}
//# sourceMappingURL=create_record.js.map