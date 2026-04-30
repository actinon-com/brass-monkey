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
    constructor(config: OdooConfig);
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
