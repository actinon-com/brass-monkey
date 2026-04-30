import { z } from 'zod';
import { ConfigStore } from '../services/config-store.js';
import { CredentialStore } from '../services/credential-store.js';
/**
 * Zod schema for remove_instance tool input.
 */
export declare const RemoveInstanceSchema: z.ZodObject<{
    alias: z.ZodString;
}, z.core.$strip>;
export type RemoveInstanceInput = z.infer<typeof RemoveInstanceSchema>;
/**
 * Tool to remove an Odoo instance configuration and its secure credentials.
 * @param configStore The ConfigStore instance.
 * @param credentialStore The CredentialStore instance.
 * @param input The RemoveInstanceInput parameters.
 * @returns Success message.
 */
export declare function removeInstance(configStore: ConfigStore, credentialStore: CredentialStore, input: RemoveInstanceInput): Promise<string>;
