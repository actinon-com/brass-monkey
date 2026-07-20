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
     * Cleans up raw Odoo tracebacks to return user-friendly business errors.
     */
    private formatError;
}
