/**
 * Service to manage Odoo API keys securely using the OS keychain.
 */
export declare class CredentialStore {
    private serviceName;
    /**
     * Securely stores an API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     * @param apiKey The secret API key or password.
     */
    saveApiKey(alias: string, apiKey: string): Promise<void>;
    /**
     * Retrieves the API key for a specific Odoo instance.
     * Checks the OS keychain first, then falls back to ODOO_API_KEY env var for the 'default' alias.
     * @param alias The unique alias of the instance.
     */
    getApiKey(alias: string): Promise<string | null>;
    /**
     * Deletes the API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     */
    deleteApiKey(alias: string): Promise<void>;
}
