import { OdooClient } from './odoo-client.js';
import { AuditService } from './audit-service.js';
/**
 * Registry of active Odoo instances. Handles lazy-loading and multi-environment context.
 */
export class InstanceManager {
    configStore;
    credentialStore;
    clients = new Map();
    audits = new Map();
    defaultAlias = null;
    constructor(configStore, credentialStore) {
        this.configStore = configStore;
        this.credentialStore = credentialStore;
    }
    /**
     * Retrieves or initializes an OdooClient for a specific instance alias.
     * Reconstructs the configuration with the API key from the secure CredentialStore.
     */
    async getClient(alias) {
        const instances = await this.configStore.load();
        if (instances.length === 0) {
            throw new Error('No Odoo instances configured. Use setup_instance first.');
        }
        const targetAlias = alias || this.defaultAlias || instances[0].alias;
        if (!this.clients.has(targetAlias)) {
            const metadata = instances.find(i => i.alias === targetAlias);
            if (!metadata)
                throw new Error(`Odoo instance alias not found: ${targetAlias}`);
            const apiKey = await this.credentialStore.getApiKey(targetAlias);
            if (!apiKey)
                throw new Error(`Secure API key not found for alias: ${targetAlias}. Please run setup_instance again.`);
            const client = new OdooClient({ ...metadata, api_key: apiKey });
            this.clients.set(targetAlias, client);
            this.audits.set(targetAlias, new AuditService(client));
        }
        return this.clients.get(targetAlias);
    }
    /**
     * Retrieves the AuditService for a specific instance alias.
     */
    async getAudit(alias) {
        const targetAlias = alias || this.defaultAlias || (await this.configStore.load())[0].alias;
        if (!this.audits.has(targetAlias)) {
            await this.getClient(targetAlias);
        }
        return this.audits.get(targetAlias);
    }
    /**
     * Sets the default instance for the current session.
     */
    setDefault(alias) {
        this.defaultAlias = alias;
    }
    /**
     * Lists all configured instances.
     */
    async list() {
        const instances = await this.configStore.load();
        return instances.map(i => ({ alias: i.alias, url: i.url }));
    }
}
//# sourceMappingURL=instance-manager.js.map