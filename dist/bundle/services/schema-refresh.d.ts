import { ModelMetadata } from './metadata-cache.js';
/**
 * Keeping brass-monkey's copy of a model's fields in step with Odoo.
 *
 * The metadata cache lives for the session and was never refreshed, so after a
 * module upgrade mid-session the copy stayed wrong and `inspect_model` repeated
 * it. When Odoo (or the domain check) rejects a field, brass-monkey now
 * re-reads the model once — what the agent would otherwise do by hand — and
 * says what is actually wrong.
 *
 * Re-reads are rate-limited per model so an agent repeating the same mistake
 * does not hammer the Odoo API: at most one automatic re-read per model every
 * REFRESH_INTERVAL_MS. `inspect_model(refresh: true)` is explicit and always runs.
 */
export declare const REFRESH_INTERVAL_MS: number;
/**
 * Claims the right to re-read `model` now. Returns false if it was re-read
 * within the interval, so the caller must make do with what it has.
 */
export declare function claimRefresh(client: any, model: string, now?: number): boolean;
/** Test hook: forget all re-read times. */
export declare function resetRefreshLimits(): void;
/**
 * Re-reads a model's fields from Odoo, replacing every cached copy of it.
 * Not rate-limited: callers decide (claimRefresh, or an explicit request).
 */
export declare function refreshModelMetadata(client: any, instanceAlias: string, model: string): Promise<ModelMetadata>;
/**
 * Pulls the rejected field out of an Odoo "invalid field" error, across the
 * wordings Odoo versions use:
 *   - `Invalid field 'x_foo' on model 'account.move'`         (read, read_group, older domains)
 *   - `Invalid field account.move.x_foo in leaf ('x_foo', …)`  (17/18 domains)
 *   - `Invalid field account.move.x_foo in condition (…)`      (19 domains)
 * The model in the message can differ from the model called: a dotted path
 * fails on the related model. Returns null for any other error, including
 * Odoo errors that merely mention a field.
 */
export declare function rejectedFieldName(message: string, calledModel: string): {
    model: string;
    field: string;
} | null;
/**
 * Works out why Odoo rejected `field` on `model`, re-reading the model once
 * (rate-limited), and returns advice for the agent.
 */
export declare function diagnoseRejectedField(client: any, model: string, field: string): Promise<string>;
