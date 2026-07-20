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
    companyIds = [];
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
    /** Company IDs the authenticated user may access (populated during authenticate()). */
    get accessibleCompanyIds() { return this.companyIds; }
    /**
     * True only when the authenticated user can access more than one company.
     * This reflects the *user's* company access (reliably knowable via RPC), not a
     * global claim about the instance — do not assume every instance/user is
     * multi-company. Derived from `company_ids`, so it is accurate on any call path
     * once authenticated.
     */
    get isMultiCompany() { return this.companyIds.length > 1; }
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
                    // Fetch allowed companies for cross-company visibility
                    this.objectClient.methodCall('execute_kw', [db, this.uid, api_key, 'res.users', 'read', [[this.uid]], { fields: ['company_ids'] }], (companyError, userRecords) => {
                        if (!companyError && userRecords && userRecords.length > 0) {
                            this.companyIds = userRecords[0].company_ids || [];
                        }
                        resolve(this.uid);
                    });
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
        // Safety Interceptor: Auto-detect HTML in message_post calls
        if (method === 'message_post' && kwargs && typeof kwargs.body === 'string') {
            const containsHtml = /<[a-z][\s\S]*>/i.test(kwargs.body);
            if (containsHtml && kwargs.body_is_html === undefined) {
                kwargs.body_is_html = true;
            }
        }
        // Context Injection: Enable cross-company visibility by default
        if (this.companyIds.length > 0) {
            kwargs.context = kwargs.context || {};
            if (kwargs.context.allowed_company_ids === undefined) {
                kwargs.context.allowed_company_ids = this.companyIds;
            }
        }
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
            /odoo\.exceptions\.MissingError: (.*)/,
            /ValueError: (.*)/,
            /KeyError: (.*)/
        ];
        for (const pattern of businessErrors) {
            const match = rawMessage.match(pattern);
            if (match && match[1]) {
                const msg = match[1].trim();
                // Enhanced Actionable Feedback
                if (msg.includes('does not exist') || msg.includes('column') || msg.includes('field')) {
                    // A rejected field on the metadata models themselves (ir.model / ir.model.fields)
                    // is a Brass-Monkey schema-compatibility issue (a requested column absent on this
                    // Odoo version), NOT a stale local cache — advising 'inspect_model' here would loop
                    // on the very call that is failing.
                    if (context.includes('ir.model')) {
                        return new Error(`${msg}\n💡 ACTION: This is likely an Odoo version/schema difference during metadata discovery (a requested column may not exist on this Odoo version). Please report it.`);
                    }
                    return new Error(`${msg}\n💡 ACTION: Your local schema is stale. You MUST execute 'inspect_model' for this model to synchronize.`);
                }
                if (msg.includes('Access Denied') || msg.includes('permission')) {
                    return new Error(`${msg}\n💡 ACTION: You may be missing a required Skill or User Group. Verify with 'get_environment(show_security=true)'.`);
                }
                return new Error(msg);
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