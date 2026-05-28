/**
 * Service to manage Odoo API keys securely.
 * Prefers the OS keychain (keytar) but falls back to a restricted local file
 * if the keychain is unavailable (e.g., headless Linux, missing native deps).
 */
export declare class CredentialStore {
    private serviceName;
    private fallbackPath;
    private initialized;
    private ensureInitialized;
    /**
     * Stores an API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     * @param apiKey The secret API key or password.
     */
    saveApiKey(alias: string, apiKey: string): Promise<void>;
    /**
     * Retrieves the API key for a specific Odoo instance.
     * Checks the OS keychain first, then the local fallback file,
     * and finally environment variables.
     * @param alias The unique alias of the instance.
     */
    getApiKey(alias: string): Promise<string | null>;
    /**
     * Deletes the API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     */
    deleteApiKey(alias: string): Promise<void>;
    private readFromFile;
    private saveToFile;
    private writeAllToFile;
}
