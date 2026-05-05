import { describe, it, expect, vi, beforeEach } from 'vitest';
import xmlrpc from 'xmlrpc';
import { OdooClient } from '../src/services/odoo-client.js';

vi.mock('xmlrpc', () => ({
  default: {
    createSecureClient: vi.fn().mockReturnValue({
      methodCall: vi.fn(),
    }),
  },
}));

describe('OdooClient', () => {
  const mockConfig = {
    url: 'https://test-odoo.com',
    db: 'test-db',
    username: 'admin',
    api_key: 'password',
  };

  let client: OdooClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OdooClient(mockConfig);
  });

  it('should authenticate successfully', async () => {
    const commonClient = (xmlrpc.createSecureClient as any).mock.results[0].value;
    
    commonClient.methodCall
      .mockImplementationOnce((method, params, callback) => {
        callback(null, { server_version: '15.0' }); // Version call
      })
      .mockImplementationOnce((method, params, callback) => {
        callback(null, 1); // UID response
      });

    const uid = await client.authenticate();
    expect(uid).toBe(1);
    expect(client.majorVersion).toBe(15);
    expect(commonClient.methodCall).toHaveBeenCalledWith('version', [], expect.any(Function));
    expect(commonClient.methodCall).toHaveBeenCalledWith(
      'authenticate',
      ['test-db', 'admin', 'password', {}],
      expect.any(Function)
    );
  });

  it('should throw error on authentication failure', async () => {
    const commonClient = (xmlrpc.createSecureClient as any).mock.results[0].value;
    
    commonClient.methodCall
      .mockImplementationOnce((method, params, callback) => {
        callback(null, { server_version: '15.0' });
      })
      .mockImplementationOnce((method, params, callback) => {
        callback(null, false); // Failed login
      });

    await expect(client.authenticate()).rejects.toThrow('Odoo authentication failed: Invalid credentials');
  });

  it('should execute_kw successfully', async () => {
    const commonClient = (xmlrpc.createSecureClient as any).mock.results[0].value;
    const objectClient = (xmlrpc.createSecureClient as any).mock.results[1].value;

    commonClient.methodCall
      .mockImplementationOnce((method, params, callback) => {
        callback(null, { server_version: '15.0' });
      })
      .mockImplementationOnce((method, params, callback) => {
        callback(null, 1); // UID
      });

    objectClient.methodCall.mockImplementation((method, params, callback) => {
      callback(null, [{ id: 1, name: 'Test Record' }]);
    });

    const result = await client.executeKw('res.partner', 'search_read', [[]], { limit: 1 });
    expect(result).toEqual([{ id: 1, name: 'Test Record' }]);
    expect(objectClient.methodCall).toHaveBeenCalledWith(
      'execute_kw',
      ['test-db', 1, 'password', 'res.partner', 'search_read', [[]], { limit: 1 }],
      expect.any(Function)
    );
  });

  it('should automatically inject body_is_html for message_post with HTML', async () => {
    const commonClient = (xmlrpc.createSecureClient as any).mock.results[0].value;
    const objectClient = (xmlrpc.createSecureClient as any).mock.results[1].value;

    commonClient.methodCall
      .mockImplementationOnce((method, params, callback) => callback(null, { server_version: '15.0' }))
      .mockImplementationOnce((method, params, callback) => callback(null, 1));

    objectClient.methodCall.mockImplementation((method, params, callback) => callback(null, true));

    const htmlBody = '<div><strong>Test</strong></div>';
    await client.executeKw('res.partner', 'message_post', [1], { body: htmlBody });

    expect(objectClient.methodCall).toHaveBeenCalledWith(
      'execute_kw',
      ['test-db', 1, 'password', 'res.partner', 'message_post', [1], { body: htmlBody, body_is_html: true }],
      expect.any(Function)
    );
  });

  it('should NOT inject body_is_html for plain text message_post', async () => {
    const commonClient = (xmlrpc.createSecureClient as any).mock.results[0].value;
    const objectClient = (xmlrpc.createSecureClient as any).mock.results[1].value;

    commonClient.methodCall
      .mockImplementationOnce((method, params, callback) => callback(null, { server_version: '15.0' }))
      .mockImplementationOnce((method, params, callback) => callback(null, 1));

    objectClient.methodCall.mockImplementation((method, params, callback) => callback(null, true));

    const plainBody = 'Just a plain text message';
    await client.executeKw('res.partner', 'message_post', [1], { body: plainBody });

    expect(objectClient.methodCall).toHaveBeenCalledWith(
      'execute_kw',
      ['test-db', 1, 'password', 'res.partner', 'message_post', [1], { body: plainBody }],
      expect.any(Function)
    );
  });
});
