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
     * Failures are swallowed (returns {}); use readTranslations when the caller
     * must be able to tell "identical everywhere" from "not fetched".
     */
    fetchTranslationMatrix(model: string, resIds: number[], fieldNames: string[]): Promise<Record<number, Record<string, any>>>;
    /**
     * Like fetchTranslationMatrix, but also returns a note for the agent saying
     * how to read the values — or, if the fetch failed, that the values shown are
     * in the user's language only. A plain value is otherwise ambiguous.
     */
    readTranslations(model: string, resIds: number[], fieldNames: string[]): Promise<{
        values: Record<number, Record<string, any>>;
        note: {
            fields: string[];
            languages: any;
            reading: string;
            error?: undefined;
        };
    } | {
        values: Record<number, Record<string, any>>;
        note: {
            fields: string[];
            error: string;
            reading: string;
            languages?: undefined;
        };
    }>;
    private buildTranslationMatrix;
    /**
     * Processes input values for a write/create operation, handling translatable fields.
     * Performs "Broadcast Writing" to keep languages in sync.
     * Returns the record ID plus, per translatable field, the languages written
     * and any requested languages skipped because they are not active.
     */
    applyBroadcastWrite(model: string, resId: number | null, values: Record<string, any>, transFields: string[]): Promise<{
        id: number | null;
        languagesWritten: Record<string, string[]>;
        skipped: Record<string, string[]>;
    }>;
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
