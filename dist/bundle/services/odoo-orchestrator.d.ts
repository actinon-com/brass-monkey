import { OdooClient } from './odoo-client.js';
/**
 * Orchestrator service to handle complex Odoo business logic server-side.
 * Replicates the "Forgiving Format" and "Middleware Manager" philosophy of brass-compass.
 */
export declare class OdooOrchestrator {
    private client;
    constructor(client: OdooClient);
    /**
     * Fetches all translations for a set of records and fields,
     * returning them in the 'Forgiving' format.
     */
    fetchTranslationMatrix(model: string, resIds: number[], fieldNames: string[]): Promise<Record<number, Record<string, any>>>;
    /**
     * Processes input values for a write/create operation, handling translatable fields.
     * Performs "Broadcast Writing" to keep languages in sync.
     */
    applyBroadcastWrite(model: string, resId: number | null, values: Record<string, any>, transFields: string[]): Promise<number | null>;
    /**
     * Enhances records with label expansions for Many2one fields.
     */
    enrichRelationalLabels(model: string, records: any[]): Promise<any[]>;
    /**
     * Intelligent resolution of field values.
     * 1. Resolves strings to IDs for Many2one fields via name_search.
     * 2. Converts lists of objects to (0, 0, {values}) commands for One2many/Many2many.
     */
    resolveFieldValues(model: string, values: Record<string, any>): Promise<Record<string, any>>;
}
