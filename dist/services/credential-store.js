import keytar from 'keytar';
/**
 * Service to manage Odoo API keys securely using the OS keychain.
 */
export class CredentialStore {
    serviceName = 'BrassMonkey-Odoo';
    /**
     * Securely stores an API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     * @param apiKey The secret API key or password.
     */
    async saveApiKey(alias, apiKey) {
        await keytar.setPassword(this.serviceName, alias, apiKey);
    }
    /**
     * Retrieves the API key for a specific Odoo instance.
     * Checks the OS keychain first, then falls back to ODOO_API_KEY env var for the 'default' alias.
     * @param alias The unique alias of the instance.
     */
    async getApiKey(alias) {
        const key = await keytar.getPassword(this.serviceName, alias);
        if (!key && alias === 'default' && process.env.ODOO_API_KEY) {
            return process.env.ODOO_API_KEY;
        }
        return key;
    }
    /**
     * Deletes the API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     */
    async deleteApiKey(alias) {
        await keytar.deletePassword(this.serviceName, alias);
    }
}
//# sourceMappingURL=credential-store.js.map