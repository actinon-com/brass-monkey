import { OdooClient } from './odoo-client.js';
import { AuditService } from './audit-service.js';
import { ConfigStore } from './config-store.js';
import { CredentialStore } from './credential-store.js';
/**
 * Registry of active Odoo instances. Handles lazy-loading and multi-environment context.
 */
export declare class InstanceManager {
    private configStore;
    private credentialStore;
    private clients;
    private audits;
    private defaultAlias;
    constructor(configStore: ConfigStore, credentialStore: CredentialStore);
    /**
     * Retrieves or initializes an OdooClient for a specific instance alias.
     * Reconstructs the configuration with the API key from the secure CredentialStore.
     */
    getClient(alias?: string): Promise<OdooClient>;
    /**
     * Retrieves the AuditService for a specific instance alias.
     */
    getAudit(alias?: string): Promise<AuditService>;
    /**
     * Sets the default instance for the current session.
     */
    setDefault(alias: string): void;
    /**
     * Lists all configured instances.
     */
    list(): Promise<{
        alias: string;
        url: string;
    }[]>;
}
