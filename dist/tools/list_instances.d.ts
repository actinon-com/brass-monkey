import { z } from 'zod';
import { ConfigStore } from '../services/config-store.js';
/**
 * Zod schema for list_instances tool input.
 */
export declare const ListInstancesSchema: z.ZodObject<{}, z.core.$strip>;
/**
 * Tool to list all configured Odoo instances.
 * @param configStore The ConfigStore instance.
 * @returns An array of configured instance aliases and their URLs.
 */
export declare function listInstances(configStore: ConfigStore): Promise<"No Odoo instances configured. Use setup_instance to add one." | {
    alias: string;
    url: string;
    db: string;
    username: string;
}[]>;
