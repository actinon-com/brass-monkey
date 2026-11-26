import { type OdooConfig } from '../schemas/odoo-config.schema.js';
/**
 * Type-safe Odoo XML-RPC Client.
 * Handles authentication and record manipulation via the Odoo Object API.
 */
export declare class OdooClient {
    private config;
    private commonClient;
    private objectClient;
    private uid;
    private versionInfo;
    private companyIds;
    /** Set only on a company-scoped view made by withCompany(); see executeKw. */
    private activeCompanyId;
    /** The unscoped client a withCompany() view was made from (itself when unscoped). */
    private scopeRoot;
    private companyNames;
    constructor(config: OdooConfig);
    get activeUid(): number | null;
    get db(): string;
    get url(): string;
    get writeGuard(): boolean;
    /** Company IDs the authenticated user may access (populated during authenticate()). */
    get accessibleCompanyIds(): number[];
    /**
     * True only when the authenticated user can access more than one company.
     * This reflects the *user's* company access (reliably knowable via RPC), not a
     * global claim about the instance — do not assume every instance/user is
     * multi-company. Derived from `company_ids`, so it is accurate on any call path
     * once authenticated.
     */
    get isMultiCompany(): boolean;
    /** The unscoped client, shared by every withCompany() view. Use it as a cache key. */
    get root(): OdooClient;
    /**
     * The company Odoo treats as active for this client's calls: the one set by
     * withCompany(), otherwise the first of the user's companies. Null before
     * authentication or for a user with no companies.
     */
    get activeCompany(): number | null;
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
    withCompany(companyId: number): Promise<OdooClient>;
    /** Company name for messages; falls back to the ID if it cannot be read. */
    companyName(companyId: number): Promise<string>;
    /**
     * Returns the major version of the Odoo instance (e.g. 16).
     */
    get majorVersion(): number | null;
    /**
     * Authenticates with the Odoo instance and retrieves the UID.
     * @returns The UID of the authenticated user.
     * @throws Error if authentication fails.
     */
    authenticate(): Promise<number>;
    /**
     * Paves the way for future session-based authentication (Google OAuth)
     * by adding support for Odoo's JSON-RPC endpoint.
     */
    executeJsonRpc(model: string, method: string, args?: any[], kwargs?: Record<string, any>): Promise<any>;
    /**
     * Calls a method on an Odoo model via the execute_kw RPC endpoint.
     * @param model The technical name of the Odoo model (e.g., 'res.partner').
     * @param method The method to call (e.g., 'search', 'read', 'write').
     * @param args Positional arguments for the method.
     * @param kwargs Keyword arguments for the method.
     * @returns The result of the Odoo method call.
     */
    executeKw(model: string, method: string, args?: any[], kwargs?: Record<string, any>): Promise<any>;
    /**
     * Turns an execute_kw failure into an actionable error. When Odoo rejects a
     * field name, brass-monkey re-checks the model's fields (rate-limited per
     * model, see schema-refresh.ts) so the advice says what is actually wrong
     * instead of guessing.
     */
    private explainError;
    /**
     * Cleans up raw Odoo tracebacks to return user-friendly business errors.
     */
    private formatError;
}
