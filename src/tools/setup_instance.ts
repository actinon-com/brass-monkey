import { z } from 'zod';
import { OdooClient } from '../services/odoo-client.js';
import { ConfigStore } from '../services/config-store.js';
import { CredentialStore } from '../services/credential-store.js';
import { OdooConfigSchema } from '../schemas/odoo-config.schema.js';

/**
 * Zod schema for setup_instance tool input.
 * Includes pre-processing to handle single-item arrays from agent formatting errors.
 */
const StringOrArray = z.preprocess((val) => {
  if (Array.isArray(val) && val.length === 1 && typeof val[0] === 'string') {
    return val[0];
  }
  return val;
}, z.string());

export const SetupInstanceSchema = z.object({
  alias: StringOrArray.describe('A unique name for this instance (e.g., "prod", "staging")'),
  url: StringOrArray.optional().describe('Odoo instance URL'),
  db: StringOrArray.optional().describe('Database name'),
  username: StringOrArray.optional().describe('Username/Email'),
  api_key: StringOrArray.optional().describe('Odoo External API Key or user password'),
});

export type SetupInstanceInput = z.infer<typeof SetupInstanceSchema>;

/**
 * Tool to configure, validate, or surgically update an Odoo instance.
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
  const { alias } = input;
  
  // 1. Load existing state for surgical updates
  const existingMetadata = await configStore.getByAlias(alias);
  const existingApiKey = await credentialStore.getApiKey(alias);

  // 2. Merge inputs with existing data
  const finalConfig = {
    url: input.url || existingMetadata?.url,
    db: input.db || existingMetadata?.db,
    username: input.username || existingMetadata?.username,
    api_key: input.api_key || existingApiKey,
  };

  // 3. Validation: Ensure we have a complete set of credentials
  if (!finalConfig.url || !finalConfig.db || !finalConfig.username || !finalConfig.api_key) {
    throw new Error(
      `Incomplete configuration for alias '${alias}'. ` +
      `Please provide the missing fields: ${Object.entries(finalConfig).filter(([_, v]) => !v).map(([k]) => k).join(', ')}`
    );
  }

  const client = new OdooClient({ 
    url: finalConfig.url, 
    db: finalConfig.db, 
    username: finalConfig.username, 
    api_key: finalConfig.api_key 
  });
  
  // 4. Validate credentials immediately
  await client.authenticate();
  
  const version = client.majorVersion;

  // 5. Save the secret to the OS keychain (only if provided or if it's a new instance)
  if (input.api_key) {
    await credentialStore.saveApiKey(alias, input.api_key);
  }

  // 6. Save metadata to config.json
  await configStore.save({
    alias,
    url: finalConfig.url,
    db: finalConfig.db,
    username: finalConfig.username,
    api_key: finalConfig.api_key
  });

  return `Successfully updated Odoo instance '${alias}' (Odoo v${version}).`;
}
