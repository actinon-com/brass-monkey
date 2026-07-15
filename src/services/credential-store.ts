import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir, hostname, userInfo } from 'os';
import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { createRequire } from 'node:module';

let keytar: any = null;

// Encrypted-file format constants. Stored values look like
//   v1:<iv b64>:<authTag b64>:<ciphertext b64>
// A value without the `v1:` prefix is treated as a legacy plaintext credential
// (written before encryption existed) and transparently re-encrypted on save.
const ENC_PREFIX = 'v1';
const ENC_ALGO = 'aes-256-gcm';
const KDF_SALT = 'brass-monkey.credential-store.v1';

/**
 * Service to manage Odoo API keys securely.
 *
 * Lookup order (unchanged): OS keychain → local file → environment variable.
 *
 * The OS keychain (keytar) is a best-effort *enhancement*: keytar is a native
 * module, and a single bundled build can only ever carry one platform's binary,
 * so it cannot be relied on across macOS/Windows/Linux. The guaranteed
 * cross-platform baseline is therefore the local file — encrypted at rest with
 * AES-256-GCM (see the security note in the README). Hosts that inject
 * ODOO_API_KEY (e.g. Claude Desktop / Claude Code) never touch either path.
 *
 * Set BRASS_MONKEY_NO_KEYCHAIN=1 to skip the native keychain entirely and force
 * the pure-JS encrypted-file path (useful on headless CI or in sandboxes).
 */
export class CredentialStore {
  private serviceName = 'BrassMonkey-Odoo';
  private fallbackPath = join(homedir(), '.gemini', 'brass-monkey', 'credentials.json');
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;

    // Escape hatch: force the pure-JS encrypted-file path and skip the native
    // keychain (headless CI, sandboxes, or env-var-injected hosts).
    if (process.env.BRASS_MONKEY_NO_KEYCHAIN === '1') {
      this.initialized = true;
      return;
    }

    try {
      // Load keytar through a createRequire handle rather than a static/literal
      // import. This is deliberate: it keeps keytar invisible to ncc's static
      // analysis, so the bundler neither emits a top-level `import ... "keytar"`
      // (which would make the whole bundle fail to load where keytar is absent)
      // nor copies keytar's platform-locked *.node binary into dist/bundle. At
      // runtime the require resolves keytar only when it is actually installed
      // (source/native installs); in a shipped single-file bundle with no
      // node_modules it throws and we fall through to the encrypted file below.
      const nodeRequire = createRequire(import.meta.url);
      keytar = nodeRequire('keytar');
    } catch (e: any) {
      // Keytar is expected to be absent in bundled/headless environments (native
      // binary not shipped, or libsecret-1-dev missing on Linux). The encrypted
      // local file covers those cases.
      console.warn('Note: OS Keychain (keytar) not available. Using encrypted local file storage.');
    }
    this.initialized = true;
  }

  /**
   * Stores an API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   * @param apiKey The secret API key or password.
   */
  async saveApiKey(alias: string, apiKey: string): Promise<void> {
    await this.ensureInitialized();

    let savedInKeychain = false;
    if (keytar) {
      try {
        await keytar.setPassword(this.serviceName, alias, apiKey);
        savedInKeychain = true;
      } catch (e) {
        console.warn(`Warning: Failed to save to OS Keychain: ${e instanceof Error ? e.message : String(e)}. Falling back to file storage.`);
      }
    }

    if (!savedInKeychain) {
      await this.saveToFile(alias, apiKey);
    }
  }

  /**
   * Retrieves the API key for a specific Odoo instance.
   * Checks the OS keychain first, then the local fallback file,
   * and finally environment variables.
   * @param alias The unique alias of the instance.
   */
  async getApiKey(alias: string): Promise<string | null> {
    await this.ensureInitialized();

    // 1. Try OS Keychain
    if (keytar) {
      try {
        const key = await keytar.getPassword(this.serviceName, alias);
        if (key) return key;
      } catch (e: any) {
        // Ignore keychain errors
      }
    }

    // 2. Try Local Fallback File (decrypted transparently)
    const fileKeys = await this.readFromFile();
    if (fileKeys[alias]) return fileKeys[alias];

    // 3. Try Environment Variables. The env-injected API key belongs to the
    //    host-provided instance named by ODOO_ALIAS (default: 'default').
    const envAlias = process.env.ODOO_ALIAS || 'default';
    if (alias === envAlias && process.env.ODOO_API_KEY) {
      return process.env.ODOO_API_KEY;
    }

    return null;
  }

  /**
   * Deletes the API key for a specific Odoo instance.
   * @param alias The unique alias of the instance.
   */
  async deleteApiKey(alias: string): Promise<void> {
    await this.ensureInitialized();

    if (keytar) {
      try {
        await keytar.deletePassword(this.serviceName, alias);
      } catch (e) {
        // Ignore
      }
    }

    const fileKeys = await this.readFromFile();
    if (fileKeys[alias]) {
      delete fileKeys[alias];
      await this.writeAllToFile(fileKeys);
    }
  }

  // --- Encryption helpers (AES-256-GCM, node:crypto, no extra dependency) ---

  /**
   * Derives the 32-byte file-encryption key from stable machine/user identity.
   * This is obfuscation-grade: it binds the file to this OS user + machine so it
   * is not readable off-box or from a backup. It does NOT protect against an
   * attacker already running as this user, who can re-derive the same key.
   */
  private getEncryptionKey(): Buffer {
    let user = 'unknown';
    try {
      user = userInfo().username;
    } catch {
      // No passwd entry available; fall through with the placeholder.
    }
    const material = `${user}::${hostname()}::${homedir()}`;
    return scryptSync(material, KDF_SALT, 32);
  }

  private encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ENC_ALGO, this.getEncryptionKey(), iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [ENC_PREFIX, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':');
  }

  /** Returns the decrypted plaintext, or null if the blob can't be decrypted. */
  private decrypt(blob: string): string | null {
    try {
      const parts = blob.split(':');
      if (parts.length !== 4 || parts[0] !== ENC_PREFIX) return null;
      const [, ivB64, tagB64, ctB64] = parts;
      const decipher = createDecipheriv(ENC_ALGO, this.getEncryptionKey(), Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
      return pt.toString('utf8');
    } catch {
      return null;
    }
  }

  // --- File persistence ---

  private async readRawFile(): Promise<Record<string, unknown>> {
    try {
      const data = await readFile(this.fallbackPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }

  /**
   * Reads the fallback file and returns decrypted plaintext values.
   * `v1:`-prefixed values are decrypted; anything else is treated as a legacy
   * plaintext credential and returned as-is (re-encrypted on the next write).
   * Entries that fail to decrypt (e.g. file copied to another machine) are
   * skipped rather than crashing the lookup.
   */
  private async readFromFile(): Promise<Record<string, string>> {
    const raw = await this.readRawFile();
    const out: Record<string, string> = {};
    for (const [alias, value] of Object.entries(raw)) {
      if (typeof value !== 'string') continue;
      if (value.startsWith(`${ENC_PREFIX}:`)) {
        const dec = this.decrypt(value);
        if (dec === null) {
          console.warn(`Note: stored credential for '${alias}' could not be decrypted on this machine; ignoring it. Re-run setup_instance to restore it.`);
          continue;
        }
        out[alias] = dec;
      } else {
        // Legacy plaintext credential (written before encryption existed).
        out[alias] = value;
      }
    }
    return out;
  }

  private async saveToFile(alias: string, apiKey: string): Promise<void> {
    const keys = await this.readFromFile();
    keys[alias] = apiKey;
    await this.writeAllToFile(keys);
  }

  /** Writes the full credential map, encrypting every value at rest. */
  private async writeAllToFile(keys: Record<string, string>): Promise<void> {
    try {
      await mkdir(join(homedir(), '.gemini', 'brass-monkey'), { recursive: true });
      const encrypted: Record<string, string> = {};
      for (const [alias, apiKey] of Object.entries(keys)) {
        encrypted[alias] = this.encrypt(apiKey);
      }
      await writeFile(this.fallbackPath, JSON.stringify(encrypted), {
        mode: 0o600, // Restricted permissions (read/write only by owner)
      });
    } catch (e) {
      console.error('Failed to save credentials to file:', e);
      throw new Error('Unable to store credentials securely.');
    }
  }
}
