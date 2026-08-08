/**
 * Shared safety and auditing envelope for the execution tools (`execute_action`
 * and `execute_method`).
 *
 * Both tools run code that Brass-Monkey cannot fully see in advance, so the
 * protections that `write_record` gets for free (a field-level before snapshot)
 * have to be reconstructed deliberately. Keeping that reconstruction in one
 * place is the point of this class: the two tools contribute only their own
 * classifier, and cannot drift apart on justification, target resolution,
 * snapshot handling or the audit trail.
 */
export class ExecutionGuard {
    client;
    audit;
    constructor(client, audit) {
        this.client = client;
        this.audit = audit;
    }
    /**
     * Resolves the target recordset to ids plus display names.
     *
     * An empty recordset is refused unless explicitly opted into: many server
     * actions and workflow methods fall back to acting on every record in scope
     * when handed nothing, so a silently empty set is a foot-gun rather than a
     * no-op.
     */
    async resolveTargets(model, ids, allowEmpty) {
        if (ids.length === 0) {
            if (!allowEmpty) {
                throw new Error(`No target records supplied for ${model}. An empty recordset is refused by default ` +
                    `because many actions and methods fall back to acting on their entire scope when given ` +
                    `nothing. Pass explicit "ids", or set "allow_empty_recordset": true if acting on no ` +
                    `specific record is genuinely intended.`);
            }
            return [];
        }
        // `display_name` is a non-stored computed field and is not readable on every
        // model or Odoo version, so it is probed rather than assumed — the same
        // pattern metadata-resolver.ts uses before adding it to a base field list.
        const labelFields = await this.availableFields(model, ['display_name', 'name']);
        const records = await this.client.executeKw(model, 'read', [ids], {
            // An empty field list makes Odoo return every column, so fall back to `id`.
            fields: labelFields.length > 0 ? labelFields : ['id'],
        });
        const found = new Map((records || []).map((r) => [r.id, r.display_name || r.name || `ID ${r.id}`]));
        const missing = ids.filter((id) => !found.has(id));
        if (missing.length > 0) {
            throw new Error(`Target records do not exist on ${model}: ${missing.join(', ')}. ` +
                `Verify the ids with search_records before executing.`);
        }
        return ids.map((id) => ({ id, display_name: found.get(id) }));
    }
    /**
     * Refuses an execution the pre-flight classified as unsafe, unless the caller
     * has acknowledged it. The full report travels with the error so the agent can
     * read what it is being asked to acknowledge without a second round-trip.
     */
    assertAcknowledged(report, acknowledged) {
        if (!report.requires_acknowledgement || acknowledged)
            return;
        throw new Error(`Execution refused: this ${report.kind.replace('_', ' ')} is classified as ` +
            `"${report.classification}" and is blocked by default.\n` +
            `Reasons:\n${report.reasons.map((r) => `  - ${r}`).join('\n')}\n\n` +
            `Pre-flight report:\n${JSON.stringify(report.details, null, 2)}\n\n` +
            `Review the above, explain the risk to the user in your message, and re-issue the call ` +
            `with "acknowledge_unsafe": true if it is genuinely intended.`);
    }
    /**
     * Reads the given fields across the target recordset.
     *
     * When the fields cannot be determined ahead of time (arbitrary Python, a
     * webhook, a method whose effect is opaque) this returns a null payload with
     * the reason attached. That distinction matters in the audit log: an empty
     * object reads as "nothing changed", whereas a null plus a reason records
     * honestly that no snapshot was possible.
     */
    async captureSnapshot(model, ids, fields, unavailableReason) {
        if (!fields || fields.length === 0 || ids.length === 0) {
            return {
                data: null,
                unavailable_reason: unavailableReason ??
                    (ids.length === 0
                        ? 'No target records, so there is no record state to capture.'
                        : 'The effect of this execution cannot be determined in advance, so no meaningful before-state could be captured.'),
            };
        }
        try {
            const records = await this.client.executeKw(model, 'read', [ids], { fields });
            const data = {};
            for (const rec of records || []) {
                const { id, ...rest } = rec;
                data[id] = rest;
            }
            return { data };
        }
        catch (e) {
            return {
                data: null,
                unavailable_reason: `Snapshot read failed: ${e?.message ?? String(e)}`,
            };
        }
    }
    /**
     * Determines which of the requested fields actually exist on the model.
     *
     * Column availability drifts between Odoo versions, so every field list this
     * codebase sends is probed rather than assumed (the same defensive pattern
     * `inspect_model` uses after a schema-drift crash on Odoo 15).
     */
    async availableFields(model, candidates) {
        try {
            const meta = await this.client.executeKw(model, 'fields_get', [], {
                attributes: ['type'],
            });
            return candidates.filter((f) => meta && Object.prototype.hasOwnProperty.call(meta, f));
        }
        catch {
            return [];
        }
    }
    /**
     * Writes the execution to all three audit channels: the local JSONL history,
     * Odoo's `ir.logging`, and each target record's Chatter.
     *
     * Logged at `warning` level by default, matching `unlink_record`: an execution
     * is not reversible from a snapshot the way a field write is.
     */
    async recordExecution(params) {
        const { kind, model, label, targets, justification, before, after, report, result } = params;
        const payload = {
            label,
            classification: report.classification,
            acknowledged_unsafe: report.requires_acknowledgement,
            before: before.data,
            after: after.data,
            snapshot_unavailable_reason: before.unavailable_reason ?? after.unavailable_reason,
            follow_up_action: result ?? null,
        };
        if (targets.length === 0) {
            await this.audit.logLocalAction(kind, model, 0, payload, justification);
        }
        else {
            for (const target of targets) {
                await this.audit.logLocalAction(kind, model, target.id, payload, justification);
            }
        }
        const targetLabel = targets.length === 0
            ? 'no specific record'
            : targets.map((t) => `${t.display_name} (${t.id})`).join(', ');
        await this.audit.logSystemEvent(`Executed ${kind} "${label}" on ${model} [${targetLabel}]: ${justification}`, 'warning');
        const body = this.formatExecutionSummary(kind, label, justification, before);
        for (const target of targets) {
            await this.audit.postChatterMessage(model, target.id, body);
        }
    }
    /**
     * Builds the Chatter body for an execution. Mirrors the shape of
     * `AuditService.formatWriteSnapshot`, but states plainly when no before-state
     * could be captured rather than rendering an empty list.
     */
    formatExecutionSummary(kind, label, justification, before) {
        const heading = kind === 'execute_action' ? 'Server Action' : 'Method';
        let snapshotHtml;
        if (before.data && Object.keys(before.data).length > 0) {
            const rows = Object.entries(before.data)
                .map(([id, fields]) => `<li><code>${id}</code>: ${Object.entries(fields)
                .map(([k, v]) => `<code>${k}</code>=${JSON.stringify(v)}`)
                .join(', ')}</li>`)
                .join('');
            snapshotHtml = `<p><strong>Before Snapshot (for Reversibility):</strong></p><ul>${rows}</ul>`;
        }
        else {
            snapshotHtml =
                `<p><strong>Before Snapshot:</strong> not available &mdash; ` +
                    `${before.unavailable_reason ?? 'the effect of this execution could not be determined in advance.'}</p>`;
        }
        return `
      <p><strong>${heading} executed:</strong> <code>${label}</code></p>
      <p><strong>Justification:</strong> ${justification}</p>
      ${snapshotHtml}
    `;
    }
}
/**
 * Normalizes an id argument that may arrive as a JSON-serialized string, a bare
 * number, or a real array.
 *
 * Hosts have been observed replacing nested JSON structures with internal
 * reference integers before the payload reaches the server, which is why the
 * static schemas advertise these parameters as strings and the Zod layer accepts
 * every plausible shape.
 */
export function coerceIdList(val) {
    if (val === undefined || val === null)
        return [];
    if (typeof val === 'number')
        return [val];
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '')
            return [];
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
        }
        catch {
            return trimmed.split(',').map((p) => p.trim()).filter(Boolean);
        }
    }
    return val;
}
/**
 * Normalizes a keyword-argument object that may arrive JSON-serialized.
 */
export function coerceKwargs(val) {
    if (val === undefined || val === null)
        return {};
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '')
            return {};
        try {
            return JSON.parse(trimmed);
        }
        catch {
            return val;
        }
    }
    return val;
}
//# sourceMappingURL=execution-guard.js.map