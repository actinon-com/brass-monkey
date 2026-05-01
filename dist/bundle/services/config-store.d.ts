import { type OdooConfig } from '../schemas/odoo-config.schema.js';
export interface InstanceConfig extends OdooConfig {
    alias: string;
}
/**
 * Service to manage persistent Odoo configurations in the user's home directory.
 */
export declare class ConfigStore {
    private configPath;
    constructor();
    /**
     * Loads all configured Odoo instances.
     * Merges persistent config with environment variables from the official setup mechanism.
     */
    load(): Promise<InstanceConfig[]>;
    /**
     * Retrieves a specific Odoo instance configuration by its alias.
     */
    getByAlias(alias: string): Promise<InstanceConfig | null>;
    /**
     * Saves non-sensitive Odoo instance metadata to config.json.
     * Sensitive credentials must be handled by the CredentialStore.
     */
    save(config: InstanceConfig): Promise<void>;
    /**
     * Removes an Odoo instance by its alias.
     */
    remove(alias: string): Promise<void>;
    private ensureDir;
}
