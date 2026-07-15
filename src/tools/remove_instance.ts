import { z } from 'zod';
import { ConfigStore } from '../services/config-store.js';
import { CredentialStore } from '../services/credential-store.js';

/**
 * Zod schema for remove_instance tool input.
 */
export const RemoveInstanceSchema = z.object({
  alias: z.string().describe('The alias of the instance to remove'),
});

export type RemoveInstanceInput = z.infer<typeof RemoveInstanceSchema>;

/**
 * Tool to remove an Odoo instance configuration and its secure credentials.
 * @param configStore The ConfigStore instance.
 * @param credentialStore The CredentialStore instance.
 * @param input The RemoveInstanceInput parameters.
 * @returns Success message.
 */
export async function removeInstance(
  configStore: ConfigStore,
  credentialStore: CredentialStore,
  input: RemoveInstanceInput
) {
  const { alias } = input;

  const envAlias = process.env.ODOO_ALIAS || 'default';
  if (alias === envAlias && process.env.ODOO_URL) {
    throw new Error(
      `The '${alias}' instance is injected by your host's environment configuration (ODOO_* variables) ` +
      "and cannot be removed via this tool. Update or unset those environment variables in your MCP host " +
      "(e.g. your Claude Code plugin, Claude Desktop bundle, or Gemini CLI extension config) instead."
    );
  }

  const existing = await configStore.getByAlias(alias);
  if (!existing) {
    throw new Error(`Odoo instance alias not found: ${alias}`);
  }

  // 1. Remove metadata from config.json
  await configStore.remove(alias);

  // 2. Purge secret from OS keychain
  await credentialStore.deleteApiKey(alias);

  return `Successfully removed Odoo instance '${alias}' and its secure credentials.`;
}
