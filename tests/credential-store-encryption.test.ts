import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Redirect homedir() to a real, writable temp dir so the store reads/writes an
// isolated credentials.json instead of the developer's ~/.gemini/brass-monkey.
// hostname()/userInfo() stay real (the mock only overrides homedir), so the
// scrypt-derived encryption key is stable across store instances in this run.
const { FAKE_HOME } = vi.hoisted(() => ({
  FAKE_HOME: '/tmp/claude-1000/-home-mcm-projects/e56f99db-0af4-45ea-8f5a-c3a636d9ac79/scratchpad/bm-cred-enc-home',
}));
vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('os')>();
  return { ...actual, homedir: () => FAKE_HOME };
});

import { CredentialStore } from '../src/services/credential-store.js';

/**
 * Locks in the Phase 2 encrypted-at-rest fallback file. All tests force the
 * pure-JS file path via BRASS_MONKEY_NO_KEYCHAIN so they are deterministic and
 * never touch the developer's real OS keychain (the native keytar require is
 * opaque to vitest's module mocking).
 */
const CRED_DIR = join(FAKE_HOME, '.gemini', 'brass-monkey');
const CRED_FILE = join(CRED_DIR, 'credentials.json');
const ALIAS = 'enc-test';
const SECRET = 'super-secret-odoo-key-1234567890';

describe('credential store — encryption at rest', () => {
  let savedNoKeychain: string | undefined;

  beforeEach(async () => {
    savedNoKeychain = process.env.BRASS_MONKEY_NO_KEYCHAIN;
    process.env.BRASS_MONKEY_NO_KEYCHAIN = '1'; // force the encrypted-file path
    await rm(FAKE_HOME, { recursive: true, force: true });
    await mkdir(CRED_DIR, { recursive: true });
  });

  afterEach(async () => {
    if (savedNoKeychain === undefined) delete process.env.BRASS_MONKEY_NO_KEYCHAIN;
    else process.env.BRASS_MONKEY_NO_KEYCHAIN = savedNoKeychain;
    await rm(FAKE_HOME, { recursive: true, force: true });
  });

  it('never writes the API key to disk in plaintext', async () => {
    await new CredentialStore().saveApiKey(ALIAS, SECRET);

    const raw = await readFile(CRED_FILE, 'utf-8');
    expect(raw).not.toContain(SECRET);

    const parsed = JSON.parse(raw);
    expect(parsed[ALIAS]).toMatch(/^v1:/); // versioned AES-GCM blob
  });

  it('round-trips the API key through encryption/decryption', async () => {
    await new CredentialStore().saveApiKey(ALIAS, SECRET);
    const key = await new CredentialStore().getApiKey(ALIAS);
    expect(key).toBe(SECRET);
  });

  it('reads a legacy plaintext credential and re-encrypts it on the next save', async () => {
    // Pre-encryption on-disk shape: raw plaintext values.
    await writeFile(CRED_FILE, JSON.stringify({ [ALIAS]: SECRET }), { mode: 0o600 });

    // Transparent read of the legacy value.
    expect(await new CredentialStore().getApiKey(ALIAS)).toBe(SECRET);

    // Any save rewrites the whole map encrypted (migrating the legacy entry).
    await new CredentialStore().saveApiKey(`${ALIAS}-2`, 'another-secret');
    const parsed = JSON.parse(await readFile(CRED_FILE, 'utf-8'));
    expect(parsed[ALIAS]).toMatch(/^v1:/);
    expect(parsed[`${ALIAS}-2`]).toMatch(/^v1:/);

    // Both still resolve to their plaintext values.
    expect(await new CredentialStore().getApiKey(ALIAS)).toBe(SECRET);
    expect(await new CredentialStore().getApiKey(`${ALIAS}-2`)).toBe('another-secret');
  });

  it('deletes a stored credential', async () => {
    const store = new CredentialStore();
    await store.saveApiKey(ALIAS, SECRET);
    await store.deleteApiKey(ALIAS);
    expect(await new CredentialStore().getApiKey(ALIAS)).toBeNull();
  });

  it('ignores an undecryptable entry instead of throwing', async () => {
    // A v1: blob that cannot be authenticated with this machine's derived key.
    await writeFile(CRED_FILE, JSON.stringify({ [ALIAS]: 'v1:AAAA:BBBB:CCCC' }), { mode: 0o600 });
    expect(await new CredentialStore().getApiKey(ALIAS)).toBeNull();
  });
});
