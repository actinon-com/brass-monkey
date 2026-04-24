import keytar from 'keytar';

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
    await keytar.setPassword(this.serviceName, alias, apiKey);
  }

  /**
   * Retrieves the API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   */
  async getApiKey(alias: string): Promise<string | null> {
    return await keytar.getPassword(this.serviceName, alias);
  }

  /**
   * Deletes the API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   */
  async deleteApiKey(alias: string): Promise<void> {
    await keytar.deletePassword(this.serviceName, alias);
  }
}
