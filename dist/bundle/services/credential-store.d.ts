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
export declare class CredentialStore {
    private serviceName;
    private fallbackPath;
    private initialized;
    private ensureInitialized;
    /**
     * Stores an API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     * @param apiKey The secret API key or password.
     */
    saveApiKey(alias: string, apiKey: string): Promise<void>;
    /**
     * Retrieves the API key for a specific Odoo instance.
     * Checks the OS keychain first, then the local fallback file,
     * and finally environment variables.
     * @param alias The unique alias of the instance.
     */
    getApiKey(alias: string): Promise<string | null>;
    /**
     * Deletes the API key for a specific Odoo instance.
     * @param alias The unique alias of the instance.
     */
    deleteApiKey(alias: string): Promise<void>;
    /**
     * Derives the 32-byte file-encryption key from stable machine/user identity.
     * This is obfuscation-grade: it binds the file to this OS user + machine so it
     * is not readable off-box or from a backup. It does NOT protect against an
     * attacker already running as this user, who can re-derive the same key.
     */
    private getEncryptionKey;
    private encrypt;
    /** Returns the decrypted plaintext, or null if the blob can't be decrypted. */
    private decrypt;
    private readRawFile;
    /**
     * Reads the fallback file and returns decrypted plaintext values.
     * `v1:`-prefixed values are decrypted; anything else is treated as a legacy
     * plaintext credential and returned as-is (re-encrypted on the next write).
     * Entries that fail to decrypt (e.g. file copied to another machine) are
     * skipped rather than crashing the lookup.
     */
    private readFromFile;
    private saveToFile;
    /** Writes the full credential map, encrypting every value at rest. */
    private writeAllToFile;
}
