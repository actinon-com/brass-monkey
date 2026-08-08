import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { PreflightReport } from '../services/execution-guard.js';
/**
 * Zod schema for execute_method tool input.
 * `ids` and `kwargs` accept JSON-serialized strings as well as native values.
 */
export declare const ExecuteMethodSchema: z.ZodObject<{
    model: z.ZodString;
    method: z.ZodString;
    ids: z.ZodDefault<z.ZodOptional<z.ZodPreprocess<z.ZodArray<z.ZodCoercedNumber<unknown>>>>>;
    kwargs: z.ZodDefault<z.ZodOptional<z.ZodPreprocess<z.ZodRecord<z.ZodString, z.ZodAny>>>>;
    justification: z.ZodString;
    dry_run: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    acknowledge_unsafe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    skip_view_validation: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    allow_empty_recordset: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ExecuteMethodInput = z.infer<typeof ExecuteMethodSchema>;
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
export declare function executeMethod(manager: InstanceManager, input: ExecuteMethodInput): Promise<{
    executed: boolean;
    dry_run: boolean;
    model: string;
    method: string;
    targets: import("../services/execution-guard.js").ResolvedTarget[];
    preflight: PreflightReport;
    would_refuse: boolean;
    result: null;
    state_change?: undefined;
    follow_up_action_note?: undefined;
} | {
    executed: boolean;
    dry_run: boolean;
    model: string;
    method: string;
    targets: import("../services/execution-guard.js").ResolvedTarget[];
    preflight: PreflightReport;
    state_change: {
        before: Record<number, Record<string, any>> | null;
        after: Record<number, Record<string, any>> | null;
    };
    result: any;
    follow_up_action_note: string | undefined;
    would_refuse?: undefined;
}>;
