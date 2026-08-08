import { z } from 'zod';
import { ExecutionGuard, coerceIdList, } from '../services/execution-guard.js';
/**
 * Zod schema for execute_action tool input.
 * `ids` accepts a JSON-serialized array, a bare number, or a real array.
 */
export const ExecuteActionSchema = z.object({
    action_id: z.coerce.number().describe('Database ID of the ir.actions.server record to run.'),
    model: z.string().describe('Technical model name the action runs against (e.g., "sale.order").'),
    ids: z
        .preprocess(coerceIdList, z.array(z.coerce.number()))
        .optional()
        .default([])
        .describe('Database IDs of the records to run the action against.'),
    justification: z.string().min(1).describe('Business justification for running this action.'),
    dry_run: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, return the pre-flight report without executing.'),
    acknowledge_unsafe: z
        .boolean()
        .optional()
        .default(false)
        .describe('Required to run actions that execute arbitrary code or send data outside Odoo.'),
    allow_empty_recordset: z
        .boolean()
        .optional()
        .default(false)
        .describe('Required to run an action against no specific record.'),
    instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});
/** Every column we would like from ir.actions.server; availability is probed. */
const CANDIDATE_ACTION_FIELDS = [
    'name',
    'state',
    'type',
    'model_id',
    'code',
    'child_ids',
    'update_field_id',
    'update_path',
    'evaluation_type',
    'value',
    'webhook_url',
    'binding_model_id',
    'groups_id',
    'sequence',
];
/**
 * Action states that run arbitrary code or push data outside Odoo. These are
 * blocked unless explicitly acknowledged.
 *
 * `code` is unrestricted Python. The rest are outbound: they transmit record
 * data to a third party, and unlike a field write there is no undo.
 */
const UNSAFE_STATES = {
    code: 'runs arbitrary Python with full access to the environment',
    webhook: 'posts record data to an external URL',
    mail_post: 'sends an email to recipients outside Odoo',
    sms: 'sends an SMS to recipients outside Odoo',
};
/** States whose effect is declared as data, so a before-snapshot is possible. */
const DECLARATIVE_STATES = ['object_write', 'object_create', 'update'];
/**
 * Tool to run an existing Odoo server action against an explicit recordset.
 *
 * Unlike `write_record`, the effect of a server action is not knowable from its
 * arguments: it is a mutable data row that can contain arbitrary Python. The
 * pre-flight below therefore expands the whole action tree, classifies the
 * union of what it finds, and refuses anything unsafe unless acknowledged.
 *
 * @param manager The InstanceManager instance.
 * @param input The ExecuteActionInput parameters.
 * @returns The pre-flight report, targets, and any follow-up action as inert data.
 */
export async function executeAction(manager, input) {
    const parsedInput = ExecuteActionSchema.parse(input);
    const { action_id, model, ids, justification, dry_run, acknowledge_unsafe, allow_empty_recordset, instance_alias, } = parsedInput;
    const client = await manager.getClient(instance_alias);
    const audit = await manager.getAudit(instance_alias);
    const guard = new ExecutionGuard(client, audit);
    // 1. Pre-flight: expand the action tree. This runs on every call, not only
    //    dry runs — it is the protection, and `dry_run` merely stops afterwards.
    const readableFields = await guard.availableFields('ir.actions.server', CANDIDATE_ACTION_FIELDS);
    const tree = await expandActionTree(client, action_id, readableFields);
    const flat = flatten(tree);
    // 2. Classify the union of the tree. A `multi` action whose children include
    //    Python is exactly as dangerous as a bare code action.
    const reasons = [];
    for (const node of flat) {
        const risk = node.state ? UNSAFE_STATES[node.state] : undefined;
        if (risk) {
            const where = node.id === action_id ? 'this action' : `child action "${node.name}" (${node.id})`;
            reasons.push(`${where} has state "${node.state}", which ${risk}`);
        }
    }
    // 3. Typo-catcher: the declared model must match the supplied one. This only
    //    constrains the declarative states — a code action can reach any model
    //    regardless of what model_id says, which is why the gate above is a hard
    //    default-off rather than a warning.
    for (const node of flat) {
        if (node.state &&
            DECLARATIVE_STATES.includes(node.state) &&
            node.model_technical &&
            node.model_technical !== model) {
            throw new Error(`Action ${node.id} ("${node.name}") is declared against model "${node.model_technical}", ` +
                `but was invoked with model "${model}". Re-check the action with get_action before running it.`);
        }
    }
    const declaredStates = flat.map((n) => n.state).filter(Boolean);
    const allDeclarative = declaredStates.length > 0 && declaredStates.every((s) => DECLARATIVE_STATES.includes(s));
    const snapshotFields = Array.from(new Set(flat.map((n) => n.update_field).filter(Boolean)));
    let snapshottable = false;
    let snapshotReason;
    if (!allDeclarative) {
        snapshotReason =
            `The action tree contains non-declarative steps (${Array.from(new Set(declaredStates)).join(', ')}), ` +
                `so the records and fields it will touch cannot be determined in advance.`;
    }
    else if (snapshotFields.length === 0) {
        snapshotReason =
            'The action is declarative but its target field could not be resolved on this Odoo version.';
    }
    else {
        snapshottable = true;
    }
    const report = {
        kind: 'server_action',
        classification: reasons.length > 0 ? 'unsafe' : allDeclarative ? 'declarative' : 'side_effecting',
        requires_acknowledgement: reasons.length > 0,
        reasons,
        snapshottable,
        snapshot_unavailable_reason: snapshotReason,
        details: {
            action_id,
            model,
            expansion: tree,
            states: Array.from(new Set(declaredStates)),
            snapshot_fields: snapshotFields,
        },
    };
    // 4. Resolve targets to display names so the human sees which records.
    const targets = await guard.resolveTargets(model, ids, allow_empty_recordset);
    // 5. A dry run reports what would happen, including any refusal, rather than
    //    throwing — inspection is the entire purpose of the flag.
    if (dry_run) {
        return {
            executed: false,
            dry_run: true,
            action: { id: action_id, name: tree.name, state: tree.state },
            targets,
            preflight: report,
            would_refuse: report.requires_acknowledgement && !acknowledge_unsafe,
            result: null,
        };
    }
    guard.assertAcknowledged(report, acknowledge_unsafe);
    // 6. Snapshot where the action declares its own target.
    const before = await guard.captureSnapshot(model, targets.map((t) => t.id), snapshottable ? snapshotFields : null, snapshotReason);
    // 7. Execute against the explicit recordset.
    const result = await runServerAction(client, action_id, model, targets.map((t) => t.id));
    const after = await guard.captureSnapshot(model, targets.map((t) => t.id), snapshottable ? snapshotFields : null, snapshotReason);
    await guard.recordExecution({
        kind: 'execute_action',
        model,
        label: tree.name ?? `ir.actions.server(${action_id})`,
        targets,
        justification,
        before,
        after,
        report,
        result,
    });
    return {
        executed: true,
        dry_run: false,
        action: { id: action_id, name: tree.name, state: tree.state },
        targets,
        preflight: report,
        // A server action may return a dict describing a follow-up action. It is
        // returned as inert data and is never chain-executed.
        result: result ?? null,
        follow_up_action_note: result && typeof result === 'object'
            ? 'This action returned a follow-up action. It has NOT been executed; inspect it and decide deliberately.'
            : undefined,
    };
}
/**
 * Reads an action and recursively expands its `child_ids`, resolving model and
 * field references to technical names. Guards against cycles.
 */
async function expandActionTree(client, actionId, fields, seen = new Set()) {
    if (seen.has(actionId)) {
        return { id: actionId, name: '(cycle)', children: [] };
    }
    seen.add(actionId);
    const recs = await client.executeKw('ir.actions.server', 'read', [[actionId]], { fields });
    if (!recs || recs.length === 0) {
        throw new Error(`Server action not found with ID ${actionId}. Use get_action to confirm the action exists ` +
            `and is of type ir.actions.server.`);
    }
    const rec = recs[0];
    const node = {
        id: actionId,
        name: rec.name,
        state: rec.state,
        code: rec.code || undefined,
        webhook_url: rec.webhook_url || undefined,
        children: [],
    };
    // model_id / update_field_id come back as [id, display_name]; the display name
    // is not the technical name, so resolve both through their own models.
    if (Array.isArray(rec.model_id)) {
        node.model_technical = await resolveTechnicalName(client, 'ir.model', rec.model_id[0], 'model');
    }
    if (Array.isArray(rec.update_field_id)) {
        node.update_field = await resolveTechnicalName(client, 'ir.model.fields', rec.update_field_id[0], 'name');
    }
    if (Array.isArray(rec.child_ids) && rec.child_ids.length > 0) {
        for (const childId of rec.child_ids) {
            node.children.push(await expandActionTree(client, childId, fields, seen));
        }
    }
    return node;
}
/** Reads a single technical-name column, tolerating absence on older versions. */
async function resolveTechnicalName(client, model, id, column) {
    try {
        const recs = await client.executeKw(model, 'read', [[id]], { fields: [column] });
        return recs && recs.length > 0 ? recs[0][column] : undefined;
    }
    catch {
        return undefined;
    }
}
/** Depth-first flatten of the expanded action tree. */
function flatten(node) {
    return [node, ...node.children.flatMap(flatten)];
}
/**
 * Invokes the action's public run entry point.
 *
 * The entry point name has moved between Odoo versions, so it is resolved by
 * attempt rather than assumption — the same defensive posture the rest of the
 * codebase takes with column availability.
 */
async function runServerAction(client, actionId, model, ids) {
    const context = {
        active_model: model,
        active_id: ids.length > 0 ? ids[0] : false,
        active_ids: ids,
    };
    try {
        return await client.executeKw('ir.actions.server', 'run', [[actionId]], { context });
    }
    catch (e) {
        const message = e?.message ?? String(e);
        const looksMissing = /has no attribute|is not a valid|does not exist|not callable/i.test(message);
        if (!looksMissing)
            throw e;
        return await client.executeKw('ir.actions.server', '_run', [[actionId]], { context });
    }
}
//# sourceMappingURL=execute_action.js.map