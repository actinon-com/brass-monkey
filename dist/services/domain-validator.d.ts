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
     * Helper to perform arity/grammar checks on prefix domains.
     */
    private static checkPrefixGrammar;
}
