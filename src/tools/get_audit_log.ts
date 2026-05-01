import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for get_audit_log tool input.
 */
export const GetAuditLogSchema = z.object({
  limit: z.coerce.number().optional().default(10).describe("Number of recent entries to retrieve."),
  instance_alias: z.string().optional().describe("Optional alias of the Odoo instance to use."),
});

export type GetAuditLogInput = z.infer<typeof GetAuditLogSchema>;

/**
 * Tool to retrieve recent local audit log entries.
 * Allows the agent to verify its own history and provide transparency.
 */
export async function getAuditLog(manager: InstanceManager, input: GetAuditLogInput) {
  const { limit, instance_alias } = input;
  const audit = await manager.getAudit(instance_alias);

  const logs = await audit.getLocalLogs(limit);

  if (logs.length === 0) {
    return "No recent audit log entries found.";
  }

  return {
    summary: `Retrieved ${logs.length} recent audit entry(ies).`,
    logs: logs
  };
}
