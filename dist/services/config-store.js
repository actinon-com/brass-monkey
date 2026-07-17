import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
/**
 * Service to manage persistent Odoo configurations in the user's home directory.
 */
export class ConfigStore {
    configPath;
    constructor() {
        // Legacy storage location, retained for backwards-compatibility so existing
        // Gemini CLI installs keep their configs. The path is host-agnostic in
        // practice — every host reads/writes the same file regardless of its name.
        this.configPath = join(homedir(), '.gemini', 'brass-monkey', 'config.json');
    }
    /**
     * Loads all configured Odoo instances.
     * Merges persistent config with host-injected environment variables. Any MCP
     * host (Claude Code, Claude Desktop, Antigravity, Gemini CLI) can supply a
     * default instance through the ODOO_* env-var contract; none is required to.
     */
    async load() {
        let instances = [];
        try {
            const data = await readFile(this.configPath, 'utf-8');
            const parsed = JSON.parse(data);
            instances = parsed.instances || [];
        }
        catch (error) {
            // ignore
        }
        // Host-injected environment variables (see the ODOO_* env-var contract).
        // ODOO_ALIAS names the instance; it defaults to 'default' when unset.
        if (process.env.ODOO_URL && process.env.ODOO_DB && process.env.ODOO_USERNAME) {
            const envAlias = process.env.ODOO_ALIAS || 'default';
            const existingEnv = instances.find(i => i.alias === envAlias);
            if (!existingEnv) {
                instances.unshift({
                    alias: envAlias,
                    url: process.env.ODOO_URL,
                    db: process.env.ODOO_DB,
                    username: process.env.ODOO_USERNAME,
                });
            }
        }
        return instances;
    }
    /**
     * Retrieves a specific Odoo instance configuration by its alias.
     */
    async getByAlias(alias) {
        const instances = await this.load();
        return instances.find(i => i.alias === alias) || null;
    }
    /**
     * Saves non-sensitive Odoo instance metadata to config.json.
     * Sensitive credentials must be handled by the CredentialStore.
     */
    async save(config) {
        const instances = await this.load();
        const existingIndex = instances.findIndex(i => i.alias === config.alias);
        // Strip the secret before saving to file
        const { api_key, ...metadata } = config;
        if (existingIndex > -1) {
            instances[existingIndex] = metadata;
        }
        else {
            instances.push(metadata);
        }
        await this.ensureDir();
        await writeFile(this.configPath, JSON.stringify({ instances }), {
            mode: 0o600, // Restricted permissions
        });
    }
    /**
     * Removes an Odoo instance by its alias.
     */
    async remove(alias) {
        const instances = await this.load();
        const filtered = instances.filter(i => i.alias !== alias);
        await this.ensureDir();
        await writeFile(this.configPath, JSON.stringify({ instances: filtered }));
    }
    async ensureDir() {
        const dir = join(homedir(), '.gemini', 'brass-monkey');
        await mkdir(dir, { recursive: true });
    }
}
//# sourceMappingURL=config-store.js.map