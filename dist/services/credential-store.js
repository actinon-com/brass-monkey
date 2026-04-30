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
     * @param alias The unique alias of the instance.
     */
    async getApiKey(alias) {
        return await keytar.getPassword(this.serviceName, alias);
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