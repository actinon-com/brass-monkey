import { z } from 'zod';
import { ConfigStore } from '../services/config-store.js';

/**
 * Zod schema for list_instances tool input.
 */
export const ListInstancesSchema = z.object({}); // No parameters needed

/**
 * Tool to list all configured Odoo instances.
 * @param configStore The ConfigStore instance.
 * @returns An array of configured instance aliases and their URLs.
 */
export async function listInstances(configStore: ConfigStore) {
  const instances = await configStore.load();
  
  if (instances.length === 0) {
    return "No Odoo instances configured. Use setup_instance to add one.";
  }

  return instances.map(i => ({
    alias: i.alias,
    url: i.url,
    db: i.db,
    username: i.username,
  }));
}
