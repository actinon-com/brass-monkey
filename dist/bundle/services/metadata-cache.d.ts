export interface ModelMetadata {
    baseModule: string;
    id: number;
    name: string;
    transient: boolean;
    modules: string;
    baseFields: string[];
    categorized: {
        base: Record<string, any>;
        extended: Record<string, any>;
        computed: Record<string, any>;
        related: Record<string, any>;
        relational: Record<string, any>;
        lines: Record<string, any>;
    };
    /**
     * Every field on the model, including the chatter/activity fields left out of
     * `categorized`. Used by domain validation, which must accept any real field.
     * Optional so older cache entries (and test fixtures) still type-check.
     */
    allFields?: Record<string, {
        type: string;
        relation?: string;
        companyDependent?: boolean;
    }>;
    /**
     * Fields listed in Odoo's field table (`ir.model.fields`) that the running
     * Odoo does not have loaded (absent from `fields_get`). Usually a module whose
     * code and database disagree after an upgrade. Odoo rejects these in a domain.
     */
    tableOnlyFields?: string[];
}
/**
 * Service to cache Odoo model layouts in memory during the active session.
 * Cuts N+1 query latency down to 0ms for default searches and model inspections.
 */
export declare class MetadataCache {
    private static instance;
    private cache;
    private constructor();
    static getInstance(): MetadataCache;
    private getKey;
    get(instanceAlias: string, model: string): ModelMetadata | null;
    set(instanceAlias: string, model: string, metadata: ModelMetadata): void;
    /** Drops a model's entry under every alias, so the next use rebuilds it. */
    invalidateModel(model: string): void;
    clear(): void;
}
