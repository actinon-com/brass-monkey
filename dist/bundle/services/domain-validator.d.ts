export interface ValidationResult {
    success: boolean;
    healedDomain?: any[];
    errorPayload?: {
        isError: boolean;
        message: string;
        diagnostic_hints: {
            invalid_field?: string;
            invalid_operator?: string;
            target_model: string;
            did_you_mean_substrings?: string[];
            action_directives: string[];
            explanation?: string;
        };
    };
}
export declare class DomainValidationService {
    /**
     * Main entry point to validate and potentially heal an Odoo domain array.
     */
    static validateAndHeal(client: any, model: string, domain: any[], instanceAlias?: string): Promise<ValidationResult>;
    /**
     * The fields a domain may name. `allFields` is what the running Odoo has
     * loaded (fields_get) and is authoritative when present; the categorized
     * buckets are a fallback for older cache entries and test fixtures.
     */
    private static fieldSets;
    /**
     * Arity/grammar check on prefix domains, following Odoo's normalize_domain
     * (odoo/osv/expression.py): when a complete expression is followed by more
     * terms, Odoo inserts an implicit '&'. So [A, B] is valid (= ['&', A, B]);
     * only operators left without enough operands are an error.
     */
    private static checkPrefixGrammar;
}
