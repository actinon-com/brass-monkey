import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import {
  ExecutionGuard,
  PreflightReport,
  coerceIdList,
  coerceKwargs,
} from '../services/execution-guard.js';

/**
 * Zod schema for execute_method tool input.
 * `ids` and `kwargs` accept JSON-serialized strings as well as native values.
 */
export const ExecuteMethodSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "sale.order").'),
  method: z.string().min(1).describe('Workflow method to call (e.g., "action_confirm").'),
  ids: z
    .preprocess(coerceIdList, z.array(z.coerce.number()))
    .optional()
    .default([])
    .describe('Database IDs of the records to call the method on.'),
  kwargs: z
    .preprocess(coerceKwargs, z.record(z.string(), z.any()))
    .optional()
    .default({})
    .describe('Optional keyword arguments passed through to the method.'),
  justification: z.string().min(1).describe('Business justification for calling this method.'),
  dry_run: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, return the pre-flight report without executing.'),
  acknowledge_unsafe: z
    .boolean()
    .optional()
    .default(false)
    .describe('Required for methods outside the action_/button_/toggle_ convention.'),
  skip_view_validation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip the check that the method is bound to a button in the model views.'),
  allow_empty_recordset: z
    .boolean()
    .optional()
    .default(false)
    .describe('Required to call a method against no specific record.'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type ExecuteMethodInput = z.infer<typeof ExecuteMethodSchema>;

/**
 * ORM primitives that must never be reachable through this tool.
 *
 * Each of these either has a dedicated tool that carries its own guard, or is a
 * read path with a purpose-built equivalent. Allowing them here would turn
 * `execute_method` into a bypass around every protection this codebase has: a
 * direct `write` would skip the before-snapshot `write_record` takes, and a
 * direct `unlink` would skip the audit trail `unlink_record` writes.
 *
 * This refusal is absolute. There is deliberately no override flag.
 */
const DENIED_METHODS: Record<string, string> = {
  write: 'use write_record, which captures a before-snapshot for reversibility',
  create: 'use create_record, which logs the creation with a justification',
  unlink: 'use unlink_record, which records the deletion at warning level',
  copy: 'use create_record with explicit values so the result is auditable',
  read: 'use get_record or get_records',
  search: 'use search_records',
  search_read: 'use search_records',
  search_count: 'use search_records, which returns total_count',
  read_group: 'use aggregate_records',
  fields_get: 'use inspect_model',
  fields_view_get: 'use get_view',
  get_view: 'use get_view',
  name_create: 'use create_record',
  name_get: 'use search_records, which returns a display-name mapping',
  name_search: 'use search_records',
  load: 'bulk data loading is out of scope for this tool',
  export_data: 'use search_records or download_report',
  browse: 'not an RPC-callable method',
  check_access_rights: 'use get_environment, which reports effective permissions',
  check_access_rule: 'use get_environment, which reports effective permissions',
};

/** Naming conventions Odoo uses for user-invocable workflow buttons. */
const ALLOWED_PREFIXES = ['action_', 'button_', 'toggle_'];

/** View types searched for a matching button, in order of likelihood. */
const VIEW_TYPES_TO_PROBE = ['form', 'tree', 'kanban'];

/** Fields commonly used as workflow state markers, snapshotted when present. */
const CANDIDATE_STATE_FIELDS = ['state', 'stage_id', 'active', 'status'];

/**
 * Tool to call a workflow method (a UI button) on an Odoo recordset.
 *
 * Distinct from `execute_action` because the validation model is different:
 * methods are declared by the model and are discoverable, so a call can be
 * checked against the live view definitions before it is made. Server actions
 * are mutable data rows and offer no such guarantee.
 *
 * @param manager The InstanceManager instance.
 * @param input The ExecuteMethodInput parameters.
 * @returns The pre-flight report, targets, and any follow-up action as inert data.
 */
export async function executeMethod(manager: InstanceManager, input: ExecuteMethodInput) {
  const parsedInput = ExecuteMethodSchema.parse(input);
  const {
    model,
    method,
    ids,
    kwargs,
    justification,
    dry_run,
    acknowledge_unsafe,
    skip_view_validation,
    allow_empty_recordset,
    instance_alias,
  } = parsedInput;

  // 1. Shape check before anything reaches the wire.
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(method)) {
    throw new Error(
      `"${method}" is not a valid Odoo method name. Expected an identifier such as "action_confirm".`
    );
  }

  // 2. Hard deny-list. Not overridable, by design.
  if (method.startsWith('_')) {
    throw new Error(
      `Refused: "${method}" is a private method. Brass-Monkey only calls documented, ` +
      `user-invocable workflow methods.`
    );
  }
  const deniedReason = DENIED_METHODS[method];
  if (deniedReason) {
    throw new Error(
      `Refused: "${method}" is an ORM primitive and is not callable through execute_method — ` +
      `${deniedReason}. This restriction exists so execute_method cannot bypass the guards on ` +
      `the dedicated tools, and it cannot be overridden.`
    );
  }

  const client = await manager.getClient(instance_alias);
  const audit = await manager.getAudit(instance_alias);
  const guard = new ExecutionGuard(client, audit);

  // 3. Pre-flight. Runs on every call; dry_run merely stops afterwards.
  const reasons: string[] = [];
  const matchesConvention = ALLOWED_PREFIXES.some((p) => method.startsWith(p));
  if (!matchesConvention) {
    reasons.push(
      `"${method}" does not follow the ${ALLOWED_PREFIXES.join('/')} convention Odoo uses for ` +
      `user-invocable buttons, so it may not be a workflow method at all`
    );
  }

  // A workflow button invoked from the UI receives nothing but a context. Any
  // other keyword argument means this is not the button shape the tool is scoped
  // to, so it is surfaced rather than silently forwarded.
  const foreignKwargs = Object.keys(kwargs).filter((k) => k !== 'context');
  if (foreignKwargs.length > 0) {
    reasons.push(
      `keyword arguments beyond "context" were supplied (${foreignKwargs.join(', ')}), which is ` +
      `not the shape of a UI workflow button`
    );
  }

  const viewMatch = await findButtonInViews(client, model, method);

  const stateFields = await guard.availableFields(model, CANDIDATE_STATE_FIELDS);
  const snapshottable = stateFields.length > 0;

  const report: PreflightReport = {
    kind: 'model_method',
    classification: matchesConvention ? 'workflow_button' : 'unconventional',
    requires_acknowledgement: reasons.length > 0,
    reasons,
    snapshottable,
    snapshot_unavailable_reason: snapshottable
      ? undefined
      : `${model} exposes none of the common workflow state fields ` +
        `(${CANDIDATE_STATE_FIELDS.join(', ')}), so the effect cannot be captured as a snapshot.`,
    details: {
      model,
      method,
      kwargs,
      view_validated: viewMatch.found,
      view_checked: viewMatch.checked,
      view_evidence: viewMatch.evidence,
      snapshot_fields: stateFields,
    },
  };

  const targets = await guard.resolveTargets(model, ids, allow_empty_recordset);

  // 4. A dry run reports what would happen, including any refusal, rather than
  //    throwing — inspection is the entire purpose of the flag.
  if (dry_run) {
    return {
      executed: false,
      dry_run: true,
      model,
      method,
      targets,
      preflight: report,
      would_refuse:
        (report.requires_acknowledgement && !acknowledge_unsafe) ||
        (!viewMatch.found && !skip_view_validation),
      result: null,
    };
  }

  guard.assertAcknowledged(report, acknowledge_unsafe);

  if (!viewMatch.found && !skip_view_validation) {
    throw new Error(
      `Execution refused: no <button name="${method}"> bound to an object action was found in the ` +
      `${viewMatch.checked.join(', ')} view(s) of ${model}, so this method is not verifiably a ` +
      `user-invocable workflow button.\n\n` +
      `If the button is rendered conditionally, injected at runtime, or the method is intended to ` +
      `be called without a UI counterpart, re-issue with "skip_view_validation": true.`
    );
  }

  // 5. Snapshot the workflow state markers where the model has them.
  const targetIds = targets.map((t) => t.id);
  const before = await guard.captureSnapshot(
    model,
    targetIds,
    snapshottable ? stateFields : null,
    report.snapshot_unavailable_reason
  );

  // 6. Call the method against the recordset.
  const result = await client.executeKw(model, method, [targetIds], kwargs);

  const after = await guard.captureSnapshot(
    model,
    targetIds,
    snapshottable ? stateFields : null,
    report.snapshot_unavailable_reason
  );

  await guard.recordExecution({
    kind: 'execute_method',
    model,
    label: `${model}.${method}()`,
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
    model,
    method,
    targets,
    preflight: report,
    state_change: { before: before.data, after: after.data },
    // Workflow buttons frequently return a dict describing a follow-up action
    // (a wizard, a redirect). It is returned as inert data and never chained.
    result: result ?? null,
    follow_up_action_note:
      result && typeof result === 'object' && !Array.isArray(result)
        ? 'This method returned a follow-up action. It has NOT been executed; inspect it and decide deliberately.'
        : undefined,
  };
}

/**
 * Searches the model's view definitions for a button bound to the method.
 *
 * `get_view` / `fields_view_get` return the *combined* architecture with
 * inheritance already applied, so Studio-added buttons are covered by the same
 * check as core ones.
 */
async function findButtonInViews(
  client: any,
  model: string,
  method: string
): Promise<{ found: boolean; checked: string[]; evidence?: string }> {
  const rpcMethod = (client.majorVersion || 0) >= 16 ? 'get_view' : 'fields_view_get';
  const escaped = method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const buttonRe = new RegExp(`<button\\b[^>]*\\bname\\s*=\\s*["']${escaped}["'][^>]*>`, 'i');

  const checked: string[] = [];
  for (const viewType of VIEW_TYPES_TO_PROBE) {
    let arch: string | undefined;
    try {
      const view = await client.executeKw(model, rpcMethod, [], { view_type: viewType });
      arch = view?.arch;
    } catch {
      continue;
    }
    checked.push(viewType);
    if (!arch) continue;

    const match = arch.match(buttonRe);
    if (!match) continue;

    // A button's default type is "object"; only an explicit non-object type
    // (e.g. "action") means this is not the method we are looking for.
    const tag = match[0];
    const typeMatch = tag.match(/\btype\s*=\s*["']([^"']+)["']/i);
    if (!typeMatch || typeMatch[1] === 'object') {
      return { found: true, checked, evidence: tag };
    }
  }

  return { found: false, checked };
}
