let keytar: any;
try {
  keytar = (await import('keytar')).default;
} catch (e: any) {
  // Keytar might fail to load in headless Linux environments without libsecret
  console.error('Warning: keytar failed to load. Secure storage will be unavailable.', e.message);
}

/**
 * Service to manage Odoo API keys securely using the OS keychain.
 */
export class CredentialStore {
  private serviceName = 'BrassMonkey-Odoo';

  /**
   * Securely stores an API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   * @param apiKey The secret API key or password.
   */
  async saveApiKey(alias: string, apiKey: string): Promise<void> {
    if (!keytar) {
      throw new Error('Secure storage (keytar) is not available on this system.');
    }
    await keytar.setPassword(this.serviceName, alias, apiKey);
  }

  /**
   * Retrieves the API key for a specific Odoo instance.
   * Checks the OS keychain first, then falls back to ODOO_API_KEY env var for the 'default' alias.
   * @param alias The unique alias of the instance.
   */
  async getApiKey(alias: string): Promise<string | null> {
    let key = null;
    if (keytar) {
      try {
        key = await keytar.getPassword(this.serviceName, alias);
      } catch (e: any) {
        console.error(`Warning: Failed to retrieve key for ${alias} from keytar:`, e.message);
      }
    }
    
    if (!key && alias === 'default' && process.env.ODOO_API_KEY) {
      return process.env.ODOO_API_KEY;
    }
    
    return key;
  }

  /**
   * Deletes the API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   */
  async deleteApiKey(alias: string): Promise<void> {
    if (keytar) {
      await keytar.deletePassword(this.serviceName, alias);
    }
  }
}
