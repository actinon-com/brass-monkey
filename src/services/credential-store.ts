import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

let keytar: any = null;

/**
 * Service to manage Odoo API keys securely. 
 * Prefers the OS keychain (keytar) but falls back to a restricted local file
 * if the keychain is unavailable (e.g., headless Linux, missing native deps).
 */
export class CredentialStore {
  private serviceName = 'BrassMonkey-Odoo';
  private fallbackPath = join(homedir(), '.gemini', 'brass-monkey', 'credentials.json');
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    
    try {
      // Try to load keytar. We use a dynamic import/require strategy to handle 
      // different environments and prevent bundlers from failing.
      try {
        const req = eval('require');
        keytar = req('keytar');
      } catch (e) {
        // Fallback for ESM environments where require is not defined
        const module = await import('keytar');
        keytar = module.default || module;
      }
    } catch (e: any) {
      // Keytar is expected to fail in bundled environments where 
      // native modules aren't shipped in node_modules or if 
      // libsecret-1-dev is missing on Linux.
      console.warn('Note: OS Keychain (keytar) not found. Falling back to local file storage.');
    }
    this.initialized = true;
  }

  /**
   * Stores an API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   * @param apiKey The secret API key or password.
   */
  async saveApiKey(alias: string, apiKey: string): Promise<void> {
    await this.ensureInitialized();
    
    let savedInKeychain = false;
    if (keytar) {
      try {
        await keytar.setPassword(this.serviceName, alias, apiKey);
        savedInKeychain = true;
      } catch (e) {
        console.warn(`Warning: Failed to save to OS Keychain: ${e instanceof Error ? e.message : String(e)}. Falling back to file storage.`);
      }
    }

    if (!savedInKeychain) {
      await this.saveToFile(alias, apiKey);
    }
  }

  /**
   * Retrieves the API key for a specific Odoo instance.
   * Checks the OS keychain first, then the local fallback file, 
   * and finally environment variables.
   * @param alias The unique alias of the instance.
   */
  async getApiKey(alias: string): Promise<string | null> {
    await this.ensureInitialized();
    
    // 1. Try OS Keychain
    if (keytar) {
      try {
        const key = await keytar.getPassword(this.serviceName, alias);
        if (key) return key;
      } catch (e: any) {
        // Ignore keychain errors
      }
    }
    
    // 2. Try Local Fallback File
    const fileKeys = await this.readFromFile();
    if (fileKeys[alias]) return fileKeys[alias];
    
    // 3. Try Environment Variables. The env-injected API key belongs to the
    //    host-provided instance named by ODOO_ALIAS (default: 'default').
    const envAlias = process.env.ODOO_ALIAS || 'default';
    if (alias === envAlias && process.env.ODOO_API_KEY) {
      return process.env.ODOO_API_KEY;
    }
    
    return null;
  }

  /**
   * Deletes the API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   */
  async deleteApiKey(alias: string): Promise<void> {
    await this.ensureInitialized();
    
    if (keytar) {
      try {
        await keytar.deletePassword(this.serviceName, alias);
      } catch (e) {
        // Ignore
      }
    }

    const fileKeys = await this.readFromFile();
    if (fileKeys[alias]) {
      delete fileKeys[alias];
      await this.writeAllToFile(fileKeys);
    }
  }

  private async readFromFile(): Promise<Record<string, string>> {
    try {
      const data = await readFile(this.fallbackPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  private async saveToFile(alias: string, apiKey: string): Promise<void> {
    const keys = await this.readFromFile();
    keys[alias] = apiKey;
    await this.writeAllToFile(keys);
  }

  private async writeAllToFile(keys: Record<string, string>): Promise<void> {
    try {
      await mkdir(join(homedir(), '.gemini', 'brass-monkey'), { recursive: true });
      await writeFile(this.fallbackPath, JSON.stringify(keys), {
        mode: 0o600, // Restricted permissions (read/write only by owner)
      });
    } catch (e) {
      console.error('Failed to save credentials to file:', e);
      throw new Error('Unable to store credentials securely.');
    }
  }
}
