import { z } from 'zod';
import { OdooOrchestrator } from '../services/odoo-orchestrator.js';
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
    with_translations: z.boolean().optional().default(false).describe("If True, translatable fields can be provided as strings (sync to all) or expanded lists."),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/**
 * Tool to update an existing Odoo record with snapshot-based reversibility.
 * @param manager The InstanceManager instance.
 * @param input The WriteRecordInput parameters.
 * @returns Boolean true on success.
 */
export async function writeRecord(manager, input) {
    const { model, id, values, justification, with_translations, instance_alias } = input;
    const client = await manager.getClient(instance_alias);
    const audit = await manager.getAudit(instance_alias);
    const orchestrator = new OdooOrchestrator(client);
    // 1. Identify translatable fields if flag is set
    let transFieldNames = [];
    if (with_translations) {
        const transFieldRecs = await client.executeKw('ir.model.fields', 'search_read', [[
                ['model_id.model', '=', model],
                ['name', 'in', Object.keys(values)],
                ['translate', '=', true]
            ]], { fields: ['name'] });
        transFieldNames = transFieldRecs.map((f) => f.name);
    }
    // 2. Resolve natural language values (names to IDs, objects to command tuples)
    const resolvedValues = await orchestrator.resolveFieldValues(model, values);
    // 3. Capture "Before Snapshot" for reversibility
    const fieldsToCapture = Object.keys(resolvedValues);
    let before = {};
    if (with_translations && transFieldNames.length > 0) {
        const matrix = await orchestrator.fetchTranslationMatrix(model, [id], transFieldNames);
        const standardFields = fieldsToCapture.filter(f => !transFieldNames.includes(f));
        if (standardFields.length > 0) {
            const standardBefore = await client.executeKw(model, 'read', [[id]], { fields: standardFields });
            before = { ...standardBefore[0], ...matrix[id] };
        }
        else {
            before = matrix[id];
        }
    }
    else {
        const beforeRecords = await client.executeKw(model, 'read', [[id]], { fields: fieldsToCapture });
        before = beforeRecords && beforeRecords.length > 0 ? beforeRecords[0] : {};
    }
    // 4. Execute the orchestrated write
    const resultId = await orchestrator.applyBroadcastWrite(model, id, resolvedValues, transFieldNames);
    const success = !!resultId;
    // 5. Audit and store reversibility context
    if (success) {
        await audit.logLocalAction('write', model, id, { before, after: resolvedValues }, justification);
        const body = audit.formatWriteSnapshot(before, justification);
        await audit.postChatterMessage(model, id, body);
        await audit.logSystemEvent(`Modified ${model}(${id}): ${justification}`);
    }
    return success;
}
//# sourceMappingURL=write_record.js.map