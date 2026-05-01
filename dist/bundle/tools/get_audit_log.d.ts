import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_audit_log tool input.
 */
export declare const GetAuditLogSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetAuditLogInput = z.infer<typeof GetAuditLogSchema>;
/**
 * Tool to retrieve recent local audit log entries.
 * Allows the agent to verify its own history and provide transparency.
 */
export declare function getAuditLog(manager: InstanceManager, input: GetAuditLogInput): Promise<"No recent audit log entries found." | {
    summary: string;
    logs: any[];
}>;
