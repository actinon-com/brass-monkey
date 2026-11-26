import xmlrpc from 'xmlrpc';
import { diagnoseRejectedField, rejectedFieldName } from './schema-refresh.js';
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
    /** Set only on a company-scoped view made by withCompany(); see executeKw. */
    activeCompanyId = null;
    /** The unscoped client a withCompany() view was made from (itself when unscoped). */
    scopeRoot = null;
    companyNames = new Map();
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
    /** The unscoped client, shared by every withCompany() view. Use it as a cache key. */
    get root() { return this.scopeRoot ?? this; }
    /**
     * The company Odoo treats as active for this client's calls: the one set by
     * withCompany(), otherwise the first of the user's companies. Null before
     * authentication or for a user with no companies.
     */
    get activeCompany() {
        return this.activeCompanyId ?? this.companyIds[0] ?? null;
    }
    /**
     * Returns a view of this client whose calls act for `companyId`, the same way
     * Odoo's `with_company()` does: that company goes first in
     * `allowed_company_ids` (Odoo's active company) and the user's other
     * companies stay in the list, so cross-company reads still work.
     *
     * The view shares this client's login. It matters for company-dependent
     * fields, which Odoo stores once per company and reads and writes for the
     * active company only.
     */
    async withCompany(companyId) {
        if (!this.uid) {
            await this.authenticate();
        }
        if (!this.companyIds.includes(companyId)) {
            throw new Error(`with_company: company ${companyId} is not one of this user's companies ` +
                `(${this.companyIds.join(', ') || 'none'}). Run get_environment to list them.`);
        }
        const scoped = Object.create(this.root);
        scoped.activeCompanyId = companyId;
        scoped.scopeRoot = this.root;
        return scoped;
    }
    /** Company name for messages; falls back to the ID if it cannot be read. */
    async companyName(companyId) {
        const names = this.root.companyNames;
        if (!names.has(companyId)) {
            try {
                const recs = await this.executeKw('res.company', 'read', [[companyId]], { fields: ['name'] });
                names.set(companyId, recs?.[0]?.name || `company ${companyId}`);
            }
            catch {
                return `company ${companyId}`;
            }
        }
        return names.get(companyId);
    }
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
        // Context Injection: Enable cross-company visibility by default. Odoo treats
        // the first company as the active one, so a withCompany() view puts its
        // company first and keeps the rest.
        if (this.companyIds.length > 0) {
            kwargs.context = kwargs.context || {};
            if (kwargs.context.allowed_company_ids === undefined) {
                const active = this.activeCompanyId;
                kwargs.context.allowed_company_ids = active === null
                    ? this.companyIds
                    : [active, ...this.companyIds.filter(id => id !== active)];
            }
        }
        let rawError = null;
        const result = await new Promise((resolve, reject) => {
            this.objectClient.methodCall('execute_kw', [db, this.uid, api_key, model, method, args, kwargs], (error, result) => {
                if (error) {
                    rawError = error;
                    return reject(error);
                }
                resolve(result);
            });
        }).catch(() => undefined);
        if (rawError === null)
            return result;
        throw await this.explainError(rawError, model, method);
    }
    /**
     * Turns an execute_kw failure into an actionable error. When Odoo rejects a
     * field name, brass-monkey re-checks the model's fields (rate-limited per
     * model, see schema-refresh.ts) so the advice says what is actually wrong
     * instead of guessing.
     */
    async explainError(error, model, method) {
        const formatted = this.formatError(error, `${model}.${method}`);
        const rejected = rejectedFieldName(error.faultString || error.message || String(error), model);
        if (!rejected || model.startsWith('ir.model') || rejected.model.startsWith('ir.model'))
            return formatted;
        try {
            const advice = await diagnoseRejectedField(this, rejected.model, rejected.field);
            return new Error(`${formatted.message}\n💡 ACTION: ${advice}`);
        }
        catch {
            return new Error(`${formatted.message}\n💡 ACTION: Check the field name with 'inspect_model(model: "${rejected.model}")'.`);
        }
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
                // A rejected field on the metadata models themselves (ir.model / ir.model.fields)
                // is a Brass-Monkey schema-compatibility issue (a requested column absent on this
                // Odoo version). Advice for a rejected field on any other model is added by
                // explainError, which can re-check the model's fields. Other errors that merely
                // mention a field (e.g. "has to be used on a property field") are Odoo's own
                // business errors and pass through unchanged.
                if (context.includes('ir.model') && rejectedFieldName(rawMessage, '') !== null) {
                    return new Error(`${msg}\n💡 ACTION: This is likely an Odoo version/schema difference during metadata discovery (a requested column may not exist on this Odoo version). Please report it.`);
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