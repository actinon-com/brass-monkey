import { z } from 'zod';
import { OdooClient } from '../services/odoo-client.js';
import { ConfigStore } from '../services/config-store.js';
import { CredentialStore } from '../services/credential-store.js';
import { OdooConfigSchema } from '../schemas/odoo-config.schema.js';

/**
 * Zod schema for setup_instance tool input.
 */
export const SetupInstanceSchema = OdooConfigSchema.extend({
  alias: z.string().min(1).describe('A unique name for this instance (e.g., "prod", "staging")'),
});

export type SetupInstanceInput = z.infer<typeof SetupInstanceSchema>;

/**
 * Tool to configure and validate a new Odoo instance.
 * @param configStore The ConfigStore instance.
 * @param credentialStore The CredentialStore instance.
 * @param input The SetupInstanceInput parameters.
 * @returns Success message with Odoo version detected.
 */
export async function setupInstance(
  configStore: ConfigStore, 
  credentialStore: CredentialStore,
  input: SetupInstanceInput
) {
  const { alias, url, db, username, api_key } = input;
  
  const client = new OdooClient({ url, db, username, api_key });
  
  // Validate credentials immediately
  await client.authenticate();
  
  const version = client.majorVersion;

  // 1. Save the secret to the OS keychain
  await credentialStore.saveApiKey(alias, api_key);

  // 2. Save non-sensitive metadata to config.json
  await configStore.save(input);

  return `Successfully configured Odoo instance '${alias}' (Odoo v${version}). The API key has been stored securely in your OS keychain.`;
}
