import { appendFile, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
/**
 * Service to handle Odoo system logging and record-level auditing (Chatter).
 * Ensures all AI-driven changes are transparent and reversible.
 */
export class AuditService {
    client;
    localLogPath;
    constructor(client) {
        this.client = client;
        this.localLogPath = join(homedir(), '.gemini', 'brass-monkey', 'audit.jsonl');
    }
    /**
     * Logs an action locally for the agent's history and verification.
     */
    async logLocalAction(action, model, resId, data, justification) {
        const entry = {
            timestamp: new Date().toISOString(),
            database: this.client.db,
            action,
            model,
            res_id: resId,
            data,
            justification
        };
        try {
            await appendFile(this.localLogPath, JSON.stringify(entry) + '\n');
        }
        catch (e) {
            console.error('Failed to write to local audit log:', e);
        }
    }
    /**
     * Retrieves recent local audit log entries.
     */
    async getLocalLogs(limit = 10) {
        try {
            const data = await readFile(this.localLogPath, 'utf-8');
            const lines = data.trim().split('\n');
            return lines.slice(-limit).map(l => JSON.parse(l));
        }
        catch (e) {
            return [];
        }
    }
    /**
     * Logs a global system event in Odoo's ir.logging model.
     * @param message The technical log message.
     * @param level The log level (default: info).
     */
    async logSystemEvent(message, level = 'info') {
        try {
            await this.client.executeKw('ir.logging', 'create', [{
                    name: 'Brass-Monkey AI Agent',
                    type: 'server',
                    dbname: this.client.config.db,
                    level,
                    message,
                    path: 'brass-monkey.mcp',
                    line: '0',
                    func: 'execute_tool',
                }]);
        }
        catch (error) {
            console.error('Failed to write to ir.logging:', error);
        }
    }
    /**
     * Posts a formatted message to a record's Chatter (mail.message).
     * @param model Technical name of the target model.
     * @param resId Database ID of the target record.
     * @param body The message body (supports HTML).
     */
    async postChatterMessage(model, resId, body) {
        try {
            await this.client.executeKw(model, 'message_post', [resId], {
                body: `<div><strong>🤖 AI Agent Action:</strong><br/>${body}</div>`,
                message_type: 'comment',
                subtype_xmlid: 'mail.mt_note',
                body_is_html: true,
            });
        }
        catch (error) {
            // Odoo models without 'mail.thread' inheritance will fail here.
            // We log to system logs but don't crash the operation.
            await this.logSystemEvent(`Failed to post chatter message to ${model}(${resId}): ${body}`, 'warning');
        }
    }
    /**
     * Formats a "Before Snapshot" for a write operation.
     * @param before Original field values.
     * @param justification The reason provided for the change.
     */
    formatWriteSnapshot(before, justification) {
        const fieldsHtml = Object.entries(before)
            .map(([k, v]) => `<li><code>${k}</code>: ${JSON.stringify(v)}</li>`)
            .join('');
        return `
      <p><strong>Justification:</strong> ${justification}</p>
      <p><strong>Before Snapshot (for Reversibility):</strong></p>
      <ul>${fieldsHtml}</ul>
    `;
    }
}
//# sourceMappingURL=audit-service.js.map