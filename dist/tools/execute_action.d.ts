import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { PreflightReport } from '../services/execution-guard.js';
/**
 * Zod schema for execute_action tool input.
 * `ids` accepts a JSON-serialized array, a bare number, or a real array.
 */
export declare const ExecuteActionSchema: z.ZodObject<{
    action_id: z.ZodCoercedNumber<unknown>;
    model: z.ZodString;
    ids: z.ZodDefault<z.ZodOptional<z.ZodPreprocess<z.ZodArray<z.ZodCoercedNumber<unknown>>>>>;
    justification: z.ZodString;
    dry_run: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    acknowledge_unsafe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    allow_empty_recordset: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ExecuteActionInput = z.infer<typeof ExecuteActionSchema>;
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
export declare function executeAction(manager: InstanceManager, input: ExecuteActionInput): Promise<{
    executed: boolean;
    dry_run: boolean;
    action: {
        id: number;
        name: string | undefined;
        state: string | undefined;
    };
    targets: import("../services/execution-guard.js").ResolvedTarget[];
    preflight: PreflightReport;
    would_refuse: boolean;
    result: null;
    follow_up_action_note?: undefined;
} | {
    executed: boolean;
    dry_run: boolean;
    action: {
        id: number;
        name: string | undefined;
        state: string | undefined;
    };
    targets: import("../services/execution-guard.js").ResolvedTarget[];
    preflight: PreflightReport;
    result: any;
    follow_up_action_note: string | undefined;
    would_refuse?: undefined;
}>;
