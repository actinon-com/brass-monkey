import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Zod schema for get_info tool input.
 */
export const GetInfoSchema = z.object({}); // No parameters needed

/**
 * Tool to get version and environment information for the Brass-Monkey extension.
 */
export async function getInfo(manager: InstanceManager) {
  // Try to read version from package.json
  let version = 'unknown';
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    version = pkg.version;
  } catch (e) {
    // Fallback if path resolution fails in some environments
  }

  const instances = await manager.list();
  const activeAlias = (manager as any).defaultAlias || (instances.length > 0 ? instances[0].alias : 'none');

  let odooVersion = 'unknown';
  try {
    const client = await manager.getClient(activeAlias === 'none' ? undefined : activeAlias);
    odooVersion = `v${client.majorVersion}`;
  } catch (e) {
    odooVersion = 'Not authenticated / No active instance';
  }

  return {
    extension: {
      name: "brass-monkey",
      version: version,
      status: "BETA"
    },
    context: {
      active_instance: activeAlias,
      odoo_version: odooVersion,
      configured_instances: instances.length,
      active_skills: [] as string[]
    },
    environment: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      os_release: os.release()
    }
  };
}
