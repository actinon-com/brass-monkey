import xmlrpc from 'xmlrpc';
import { type OdooConfig } from '../schemas/odoo-config.schema.js';

/**
 * Type-safe Odoo XML-RPC Client.
 * Handles authentication and record manipulation via the Odoo Object API.
 */
export class OdooClient {
  private commonClient: any;
  private objectClient: any;
  private uid: number | null = null;
  private versionInfo: any = null;

  constructor(private config: OdooConfig) {
    const commonUrl = new URL('/xmlrpc/2/common', config.url).toString();
    const objectUrl = new URL('/xmlrpc/2/object', config.url).toString();

    this.commonClient = xmlrpc.createSecureClient(commonUrl);
    this.objectClient = xmlrpc.createSecureClient(objectUrl);
  }

  /**
   * Returns the major version of the Odoo instance (e.g. 16).
   */
  get majorVersion(): number | null {
    if (!this.versionInfo || !this.versionInfo.server_version) return null;
    return parseInt(this.versionInfo.server_version.split('.')[0]);
  }

  /**
   * Authenticates with the Odoo instance and retrieves the UID.
   * @returns The UID of the authenticated user.
   * @throws Error if authentication fails.
   */
  async authenticate(): Promise<number> {
    const { db, username, api_key } = this.config;

    return new Promise((resolve, reject) => {
      this.commonClient.methodCall(
        'version',
        [],
        (error: any, version: any) => {
          if (error) {
            return reject(new Error(`Failed to connect to Odoo: ${error.message}`));
          }
          this.versionInfo = version;

          this.commonClient.methodCall(
            'authenticate',
            [db, username, api_key, {}],
            (authError: any, uid: any) => {
              if (authError) {
                return reject(new Error(`Odoo authentication error: ${authError.message}`));
              }
              if (!uid) {
                return reject(new Error('Odoo authentication failed: Invalid credentials'));
              }

              this.uid = uid as number;
              resolve(this.uid);
            }
          );
        }
      );
    });
  }

  /**
   * Paves the way for future session-based authentication (Google OAuth) 
   * by adding support for Odoo's JSON-RPC endpoint.
   */
  async executeJsonRpc(model: string, method: string, args: any[] = [], kwargs: Record<string, any> = {}): Promise<any> {
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
      throw new Error(`Odoo JSON-RPC error: ${result.error.message || result.error.data.message}`);
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
  async executeKw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    if (!this.uid) {
      await this.authenticate();
    }

    const { db, api_key } = this.config;

    return new Promise((resolve, reject) => {
      this.objectClient.methodCall(
        'execute_kw',
        [db, this.uid, api_key, model, method, args, kwargs],
        (error: any, result: any) => {
          if (error) {
            return reject(new Error(`Odoo execution error [${model}.${method}]: ${error.message}`));
          }
          resolve(result);
        }
      );
    });
  }
}
