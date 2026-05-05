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

  get activeUid(): number | null { return this.uid; }
  get db(): string { return this.config.db; }
  get url(): string { return this.config.url; }
  get writeGuard(): boolean { return this.config.write_guard ?? true; }

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
            return reject(this.formatError(error, 'Connection'));
          }
          this.versionInfo = version;

          this.commonClient.methodCall(
            'authenticate',
            [db, username, api_key, {}],
            (authError: any, uid: any) => {
              if (authError) {
                return reject(this.formatError(authError, 'Authentication'));
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

    // Safety Interceptor: Auto-detect HTML in message_post calls
    if (method === 'message_post' && kwargs && typeof kwargs.body === 'string') {
      const containsHtml = /<[a-z][\s\S]*>/i.test(kwargs.body);
      if (containsHtml && kwargs.body_is_html === undefined) {
        kwargs.body_is_html = true;
      }
    }

    return new Promise((resolve, reject) => {
      this.objectClient.methodCall(
        'execute_kw',
        [db, this.uid, api_key, model, method, args, kwargs],
        (error: any, result: any) => {
          if (error) {
            return reject(this.formatError(error, `${model}.${method}`));
          }
          resolve(result);
        }
      );
    });
  }

  /**
   * Cleans up raw Odoo tracebacks to return user-friendly business errors.
   */
  private formatError(error: any, context: string): Error {
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
    if (rawMessage.includes('ECONNREFUSED')) return new Error(`Connection refused: Verify the Odoo URL and Port.`);
    if (rawMessage.includes('ENOTFOUND')) return new Error(`Domain not found: Verify the Odoo URL.`);
    
    // 3. Fallback to a cleaner technical message
    return new Error(`Odoo Error [${context}]: ${rawMessage.split('\n').pop()}`);
  }
}
