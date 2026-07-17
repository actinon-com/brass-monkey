import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Redirect homedir() to a nonexistent path so the stores never read the
// developer's real ~/.gemini/brass-monkey config or fallback credential file.
// (The OS keychain is homedir-independent, so keychain-dependent negatives are
// covered via a distinctive, never-stored alias rather than by assertion.)
const { FAKE_HOME } = vi.hoisted(() => ({
  FAKE_HOME: '/tmp/claude-1000/-home-mcm-projects/e56f99db-0af4-45ea-8f5a-c3a636d9ac79/scratchpad/bm-fake-home-does-not-exist',
}));
vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  return { ...actual, homedir: () => FAKE_HOME };
});

import { ConfigStore } from '../src/services/config-store.js';
import { CredentialStore } from '../src/services/credential-store.js';

/**
 * Locks in the host-injected env-var contract (ODOO_ALIAS/URL/DB/USERNAME/API_KEY)
 * that Phase 1 made real. `ODOO_ALIAS` was previously declared in the manifest but
 * ignored (the env instance was hardcoded to 'default'); these tests guard against
 * that regression and against the removed personal 'act' special-case.
 *
 * A distinctive alias is used so credential lookups never collide with a real
 * keychain entry on the developer's machine.
 */
const ALIAS = 'claude-env-contract-test';
const ENV_KEYS = ['ODOO_ALIAS', 'ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_API_KEY'] as const;

describe('host env-var contract', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  describe('ConfigStore', () => {
    it('registers the env instance under ODOO_ALIAS when set', async () => {
      process.env.ODOO_ALIAS = ALIAS;
      process.env.ODOO_URL = 'https://env.example.com';
      process.env.ODOO_DB = 'envdb';
      process.env.ODOO_USERNAME = 'env-user';

      const instances = await new ConfigStore().load();
      const injected = instances.find(i => i.alias === ALIAS);
      expect(injected).toBeDefined();
      expect(injected?.url).toBe('https://env.example.com');
      // The old code hardcoded 'default'; honoring ODOO_ALIAS must NOT create one.
      expect(instances.some(i => i.alias === 'default')).toBe(false);
    });

    it('defaults the env instance to alias "default" when ODOO_ALIAS is unset', async () => {
      process.env.ODOO_URL = 'https://env.example.com';
      process.env.ODOO_DB = 'envdb';
      process.env.ODOO_USERNAME = 'env-user';

      const instances = await new ConfigStore().load();
      expect(instances.some(i => i.alias === 'default')).toBe(true);
    });

    it('registers no env instance when the required vars are absent', async () => {
      const instances = await new ConfigStore().load();
      expect(instances).toHaveLength(0);
    });
  });

  describe('CredentialStore', () => {
    it('resolves ODOO_API_KEY for the alias named by ODOO_ALIAS', async () => {
      process.env.ODOO_ALIAS = ALIAS;
      process.env.ODOO_API_KEY = 'env-secret';

      const key = await new CredentialStore().getApiKey(ALIAS);
      expect(key).toBe('env-secret');
    });

    it('does not leak ODOO_API_KEY to an alias other than ODOO_ALIAS', async () => {
      // Under the old code, 'act' (and only 'act'/'default') received the env key
      // regardless of ODOO_ALIAS. Now any alias != ODOO_ALIAS must be denied.
      process.env.ODOO_ALIAS = ALIAS;
      process.env.ODOO_API_KEY = 'env-secret';

      const key = await new CredentialStore().getApiKey(`${ALIAS}-other`);
      expect(key).toBeNull();
    });
  });
});
