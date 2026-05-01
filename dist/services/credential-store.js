let keytar = null;
/**
 * Service to manage Odoo API keys securely using the OS keychain.
 */
export class CredentialStore {
    serviceName = 'BrassMonkey-Odoo';
    initialized = false;
    async ensureInitialized() {
        if (this.initialized)
            return;
        try {
            // Use eval('require') to prevent bundlers (ncc/esbuild) from 
            // trying to resolve or bundle this native dependency.
            const req = eval('require');
            keytar = req('keytar');
        }
        catch (e) {
            // Keytar is expected to fail in bundled environments where 
            // native modules aren't shipped in node_modules.
            // We log to stderr so it doesn't pollute the MCP stdout.
            console.warn('Note: OS Keychain (keytar) not found. Falling back to environment variables.');
        }
        this.initialized = true;
    }
    /**
     * Securely stores an API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     * @param apiKey The secret API key or password.
     */
    async saveApiKey(alias, apiKey) {
        await this.ensureInitialized();
        if (!keytar) {
            throw new Error('Secure storage (keytar) is not available on this system. Please run "npm install" in the extension directory.');
        }
        await keytar.setPassword(this.serviceName, alias, apiKey);
    }
    /**
     * Retrieves the API key for a specific Odoo instance.
     * Checks the OS keychain first, then falls back to ODOO_API_KEY env var for the 'default' alias.
     * @param alias The unique alias of the instance.
     */
    async getApiKey(alias) {
        await this.ensureInitialized();
        let key = null;
        if (keytar) {
            try {
                key = await keytar.getPassword(this.serviceName, alias);
            }
            catch (e) {
                // Ignore keychain errors (e.g. headless linux without dbus)
            }
        }
        if (!key && (alias === 'default' || alias === 'act') && process.env.ODOO_API_KEY) {
            return process.env.ODOO_API_KEY;
        }
        return key;
    }
    /**
     * Deletes the API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     */
    async deleteApiKey(alias) {
        await this.ensureInitialized();
        if (keytar) {
            try {
                await keytar.deletePassword(this.serviceName, alias);
            }
            catch (e) {
                // Ignore
            }
        }
    }
}
//# sourceMappingURL=credential-store.js.map