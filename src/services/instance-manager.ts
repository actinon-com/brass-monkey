import { OdooClient } from './odoo-client.js';
import { AuditService } from './audit-service.js';
import { ConfigStore } from './config-store.js';
import { CredentialStore } from './credential-store.js';

/**
 * Registry of active Odoo instances. Handles lazy-loading and multi-environment context.
 */
export class InstanceManager {
  private clients = new Map<string, OdooClient>();
  private audits = new Map<string, AuditService>();
  private defaultAlias: string | null = null;

  constructor(
    private configStore: ConfigStore,
    private credentialStore: CredentialStore
  ) {}

  /**
   * Retrieves or initializes an OdooClient for a specific instance alias.
   * Reconstructs the configuration with the API key from the secure CredentialStore.
   */
  async getClient(alias?: string): Promise<OdooClient> {
    const instances = await this.configStore.load();
    if (instances.length === 0) {
      throw new Error('No Odoo instances configured. Use setup_instance first.');
    }

    const targetAlias = alias || this.defaultAlias || instances[0].alias;
    
    if (!this.clients.has(targetAlias)) {
      const metadata = instances.find(i => i.alias === targetAlias);
      if (!metadata) throw new Error(`Odoo instance alias not found: ${targetAlias}`);
      
      const apiKey = await this.credentialStore.getApiKey(targetAlias);
      if (!apiKey) throw new Error(`Secure API key not found for alias: ${targetAlias}. Please run setup_instance again.`);

      const client = new OdooClient({ ...metadata, api_key: apiKey });
      this.clients.set(targetAlias, client);
      this.audits.set(targetAlias, new AuditService(client));
    }

    return this.clients.get(targetAlias)!;
  }

  /**
   * Retrieves the AuditService for a specific instance alias.
   */
  async getAudit(alias?: string): Promise<AuditService> {
    const targetAlias = alias || this.defaultAlias || (await this.configStore.load())[0].alias;
    if (!this.audits.has(targetAlias)) {
      await this.getClient(targetAlias);
    }
    return this.audits.get(targetAlias)!;
  }

  /**
   * Sets the default instance for the current session.
   */
  setDefault(alias: string) {
    this.defaultAlias = alias;
  }

  /**
   * Lists all configured instances.
   */
  async list(): Promise<{ alias: string; url: string }[]> {
    const instances = await this.configStore.load();
    return instances.map(i => ({ alias: i.alias, url: i.url }));
  }
}
