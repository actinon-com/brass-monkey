import { OdooClient } from './odoo-client.js';

/**
 * Service to handle Odoo system logging and record-level auditing (Chatter).
 * Ensures all AI-driven changes are transparent and reversible.
 */
export class AuditService {
  constructor(private client: OdooClient) {}

  /**
   * Logs a global system event in Odoo's ir.logging model.
   * @param message The technical log message.
   * @param level The log level (default: info).
   */
  async logSystemEvent(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    try {
      await this.client.executeKw('ir.logging', 'create', [{
        name: 'Brass-Monkey AI Agent',
        type: 'server',
        dbname: (this.client as any).config.db,
        level,
        message,
        path: 'gemini.cli.extension',
        line: '0',
        func: 'execute_tool',
      }]);
    } catch (error) {
      console.error('Failed to write to ir.logging:', error);
    }
  }

  /**
   * Posts a formatted message to a record's Chatter (mail.message).
   * @param model Technical name of the target model.
   * @param resId Database ID of the target record.
   * @param body The message body (supports HTML).
   */
  async postChatterMessage(model: string, resId: number, body: string): Promise<void> {
    try {
      await this.client.executeKw(model, 'message_post', [resId], {
        body: `<div><strong>🤖 AI Agent Action:</strong><br/>${body}</div>`,
        message_type: 'comment',
        subtype_xmlid: 'mail.mt_note',
      });
    } catch (error) {
      // Odoo models without 'mail.thread' inheritance will fail here.
      // We log to system logs but don't crash the operation.
      await this.logSystemEvent(
        `Failed to post chatter message to ${model}(${resId}): ${body}`, 
        'warning'
      );
    }
  }

  /**
   * Formats a "Before Snapshot" for a write operation.
   * @param before Original field values.
   * @param justification The reason provided for the change.
   */
  formatWriteSnapshot(before: Record<string, any>, justification: string): string {
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
