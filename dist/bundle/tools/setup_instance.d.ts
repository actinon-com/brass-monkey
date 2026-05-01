import { z } from 'zod';
import { ConfigStore } from '../services/config-store.js';
import { CredentialStore } from '../services/credential-store.js';
export declare const SetupInstanceSchema: z.ZodObject<{
    alias: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
    url: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>>;
    db: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>>;
    username: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>>;
    api_key: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>>;
}, z.core.$strip>;
export type SetupInstanceInput = z.infer<typeof SetupInstanceSchema>;
/**
 * Tool to configure, validate, or surgically update an Odoo instance.
 * @param configStore The ConfigStore instance.
 * @param credentialStore The CredentialStore instance.
 * @param input The SetupInstanceInput parameters.
 * @returns Success message with Odoo version detected.
 */
export declare function setupInstance(configStore: ConfigStore, credentialStore: CredentialStore, input: SetupInstanceInput): Promise<string>;
