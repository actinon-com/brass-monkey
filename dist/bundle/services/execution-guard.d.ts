import { OdooClient } from './odoo-client.js';
import { AuditService } from './audit-service.js';
/**
 * Outcome of the pre-flight inspection that every execution tool runs before
 * touching the database. The report is returned verbatim on a dry run, and is
 * embedded in the refusal when an unsafe execution is attempted without an
 * explicit acknowledgement, so the agent can self-correct from the error alone.
 */
export interface PreflightReport {
    kind: 'server_action' | 'model_method';
    /** Short machine-readable classification, e.g. 'declarative' or 'code'. */
    classification: string;
    requires_acknowledgement: boolean;
    /** Human-readable reasons the execution was classified as unsafe. */
    reasons: string[];
    snapshottable: boolean;
    snapshot_unavailable_reason?: string;
    details: Record<string, any>;
}
export interface ResolvedTarget {
    id: number;
    display_name: string;
}
export interface CapturedSnapshot {
    data: Record<number, Record<string, any>> | null;
    unavailable_reason?: string;
}
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
export declare class ExecutionGuard {
    private client;
    private audit;
    constructor(client: OdooClient, audit: AuditService);
    /**
     * Resolves the target recordset to ids plus display names.
     *
     * An empty recordset is refused unless explicitly opted into: many server
     * actions and workflow methods fall back to acting on every record in scope
     * when handed nothing, so a silently empty set is a foot-gun rather than a
     * no-op.
     */
    resolveTargets(model: string, ids: number[], allowEmpty: boolean): Promise<ResolvedTarget[]>;
    /**
     * Refuses an execution the pre-flight classified as unsafe, unless the caller
     * has acknowledged it. The full report travels with the error so the agent can
     * read what it is being asked to acknowledge without a second round-trip.
     */
    assertAcknowledged(report: PreflightReport, acknowledged: boolean): void;
    /**
     * Reads the given fields across the target recordset.
     *
     * When the fields cannot be determined ahead of time (arbitrary Python, a
     * webhook, a method whose effect is opaque) this returns a null payload with
     * the reason attached. That distinction matters in the audit log: an empty
     * object reads as "nothing changed", whereas a null plus a reason records
     * honestly that no snapshot was possible.
     */
    captureSnapshot(model: string, ids: number[], fields: string[] | null, unavailableReason?: string): Promise<CapturedSnapshot>;
    /**
     * Determines which of the requested fields actually exist on the model.
     *
     * Column availability drifts between Odoo versions, so every field list this
     * codebase sends is probed rather than assumed (the same defensive pattern
     * `inspect_model` uses after a schema-drift crash on Odoo 15).
     */
    availableFields(model: string, candidates: string[]): Promise<string[]>;
    /**
     * Writes the execution to all three audit channels: the local JSONL history,
     * Odoo's `ir.logging`, and each target record's Chatter.
     *
     * Logged at `warning` level by default, matching `unlink_record`: an execution
     * is not reversible from a snapshot the way a field write is.
     */
    recordExecution(params: {
        kind: string;
        model: string;
        label: string;
        targets: ResolvedTarget[];
        justification: string;
        before: CapturedSnapshot;
        after: CapturedSnapshot;
        report: PreflightReport;
        result: any;
    }): Promise<void>;
    /**
     * Builds the Chatter body for an execution. Mirrors the shape of
     * `AuditService.formatWriteSnapshot`, but states plainly when no before-state
     * could be captured rather than rendering an empty list.
     */
    private formatExecutionSummary;
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
export declare function coerceIdList(val: unknown): unknown;
/**
 * Normalizes a keyword-argument object that may arrive JSON-serialized.
 */
export declare function coerceKwargs(val: unknown): unknown;
