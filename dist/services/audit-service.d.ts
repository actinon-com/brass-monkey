import { OdooClient } from './odoo-client.js';
/**
 * Service to handle Odoo system logging and record-level auditing (Chatter).
 * Ensures all AI-driven changes are transparent and reversible.
 */
export declare class AuditService {
    private client;
    constructor(client: OdooClient);
    /**
     * Logs a global system event in Odoo's ir.logging model.
     * @param message The technical log message.
     * @param level The log level (default: info).
     */
    logSystemEvent(message: string, level?: 'info' | 'warning' | 'error'): Promise<void>;
    /**
     * Posts a formatted message to a record's Chatter (mail.message).
     * @param model Technical name of the target model.
     * @param resId Database ID of the target record.
     * @param body The message body (supports HTML).
     */
    postChatterMessage(model: string, resId: number, body: string): Promise<void>;
    /**
     * Formats a "Before Snapshot" for a write operation.
     * @param before Original field values.
     * @param justification The reason provided for the change.
     */
    formatWriteSnapshot(before: Record<string, any>, justification: string): string;
}
