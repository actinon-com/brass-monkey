import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { OdooConfigSchema, type OdooConfig } from '../schemas/odoo-config.schema.js';

export interface InstanceConfig extends OdooConfig {
  alias: string;
}

/**
 * Service to manage persistent Odoo configurations in the user's home directory.
 */
export class ConfigStore {
  private configPath: string;

  constructor() {
    this.configPath = join(homedir(), '.gemini', 'brass-monkey', 'config.json');
  }

  /**
   * Loads all configured Odoo instances.
   */
  async load(): Promise<InstanceConfig[]> {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.instances || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Retrieves a specific Odoo instance configuration by its alias.
   */
  async getByAlias(alias: string): Promise<InstanceConfig | null> {
    const instances = await this.load();
    return instances.find(i => i.alias === alias) || null;
  }

  /**
   * Saves non-sensitive Odoo instance metadata to config.json.
   * Sensitive credentials must be handled by the CredentialStore.
   */
  async save(config: InstanceConfig): Promise<void> {
    const instances = await this.load();
    const existingIndex = instances.findIndex(i => i.alias === config.alias);

    // Strip the secret before saving to file
    const { api_key, ...metadata } = config;

    if (existingIndex > -1) {
      instances[existingIndex] = metadata as InstanceConfig;
    } else {
      instances.push(metadata as InstanceConfig);
    }

    await this.ensureDir();
    await writeFile(this.configPath, JSON.stringify({ instances }, null, 2), {
      mode: 0o600, // Restricted permissions
    });
  }

  /**
   * Removes an Odoo instance by its alias.
   */
  async remove(alias: string): Promise<void> {
    const instances = await this.load();
    const filtered = instances.filter(i => i.alias !== alias);
    await this.ensureDir();
    await writeFile(this.configPath, JSON.stringify({ instances: filtered }, null, 2));
  }

  private async ensureDir() {
    const dir = join(homedir(), '.gemini', 'brass-monkey');
    await mkdir(dir, { recursive: true });
  }
}
