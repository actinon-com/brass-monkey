import xmlrpc from 'xmlrpc';
/**
 * Type-safe Odoo XML-RPC Client.
 * Handles authentication and record manipulation via the Odoo Object API.
 */
export class OdooClient {
    config;
    commonClient;
    objectClient;
    uid = null;
    versionInfo = null;
    constructor(config) {
        this.config = config;
        const commonUrl = new URL('/xmlrpc/2/common', config.url).toString();
        const objectUrl = new URL('/xmlrpc/2/object', config.url).toString();
        this.commonClient = xmlrpc.createSecureClient(commonUrl);
        this.objectClient = xmlrpc.createSecureClient(objectUrl);
    }
    get activeUid() { return this.uid; }
    get db() { return this.config.db; }
    get url() { return this.config.url; }
    get writeGuard() { return this.config.write_guard ?? true; }
    /**
     * Returns the major version of the Odoo instance (e.g. 16).
     */
    get majorVersion() {
        if (!this.versionInfo || !this.versionInfo.server_version)
            return null;
        return parseInt(this.versionInfo.server_version.split('.')[0]);
    }
    /**
     * Authenticates with the Odoo instance and retrieves the UID.
     * @returns The UID of the authenticated user.
     * @throws Error if authentication fails.
     */
    async authenticate() {
        const { db, username, api_key } = this.config;
        return new Promise((resolve, reject) => {
            this.commonClient.methodCall('version', [], (error, version) => {
                if (error) {
                    return reject(this.formatError(error, 'Connection'));
                }
                this.versionInfo = version;
                this.commonClient.methodCall('authenticate', [db, username, api_key, {}], (authError, uid) => {
                    if (authError) {
                        return reject(this.formatError(authError, 'Authentication'));
                    }
                    if (!uid) {
                        return reject(new Error('Odoo authentication failed: Invalid credentials'));
                    }
                    this.uid = uid;
                    resolve(this.uid);
                });
            });
        });
    }
    /**
     * Paves the way for future session-based authentication (Google OAuth)
     * by adding support for Odoo's JSON-RPC endpoint.
     */
    async executeJsonRpc(model, method, args = [], kwargs = {}) {
        const url = new URL('/jsonrpc', this.config.url).toString();
        const payload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [this.config.db, this.uid, this.config.api_key, model, method, args, kwargs],
            },
            id: Math.floor(Math.random() * 1000000000),
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.error) {
            throw this.formatError(result.error, 'JSON-RPC');
        }
        return result.result;
    }
    /**
     * Calls a method on an Odoo model via the execute_kw RPC endpoint.
     * @param model The technical name of the Odoo model (e.g., 'res.partner').
     * @param method The method to call (e.g., 'search', 'read', 'write').
     * @param args Positional arguments for the method.
     * @param kwargs Keyword arguments for the method.
     * @returns The result of the Odoo method call.
     */
    async executeKw(model, method, args = [], kwargs = {}) {
        if (!this.uid) {
            await this.authenticate();
        }
        const { db, api_key } = this.config;
        return new Promise((resolve, reject) => {
            this.objectClient.methodCall('execute_kw', [db, this.uid, api_key, model, method, args, kwargs], (error, result) => {
                if (error) {
                    return reject(this.formatError(error, `${model}.${method}`));
                }
                resolve(result);
            });
        });
    }
    /**
     * Cleans up raw Odoo tracebacks to return user-friendly business errors.
     */
    formatError(error, context) {
        const rawMessage = error.faultString || error.message || String(error);
        // 1. Check for standard Odoo Business Exceptions
        const businessErrors = [
            /odoo\.exceptions\.UserError: (.*)/,
            /odoo\.exceptions\.ValidationError: (.*)/,
            /odoo\.exceptions\.AccessError: (.*)/,
            /odoo\.exceptions\.MissingError: (.*)/
        ];
        for (const pattern of businessErrors) {
            const match = rawMessage.match(pattern);
            if (match && match[1]) {
                return new Error(match[1].trim());
            }
        }
        // 2. Check for common environment issues
        if (rawMessage.includes('ECONNREFUSED'))
            return new Error(`Connection refused: Verify the Odoo URL and Port.`);
        if (rawMessage.includes('ENOTFOUND'))
            return new Error(`Domain not found: Verify the Odoo URL.`);
        // 3. Fallback to a cleaner technical message
        return new Error(`Odoo Error [${context}]: ${rawMessage.split('\n').pop()}`);
    }
}
//# sourceMappingURL=odoo-client.js.map