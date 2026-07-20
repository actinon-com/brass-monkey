import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInstance } from '../src/tools/setup_instance.js';
import { listInstances } from '../src/tools/list_instances.js';
import { switchInstance } from '../src/tools/switch_instance.js';
import { removeInstance } from '../src/tools/remove_instance.js';
import { getInfo } from '../src/tools/get_info.js';
import { OdooClient } from '../src/services/odoo-client.js';

vi.mock('../src/services/odoo-client.js', () => {
  return {
    OdooClient: class {
      authenticate = vi.fn().mockResolvedValue(1);
      majorVersion = 18;
    },
  };
});

describe('Workspace Tools', () => {
  let mockConfigStore: any;
  let mockCredentialStore: any;
  let mockManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigStore = {
      save: vi.fn().mockResolvedValue(true),
      load: vi.fn().mockResolvedValue([
        { alias: 'prod', url: 'https://prod.com', db: 'db', username: 'admin' }
      ]),
      getByAlias: vi.fn().mockImplementation((alias) => {
        if (alias === 'prod') return { alias: 'prod', url: 'https://prod.com', db: 'db', username: 'admin' };
        return null;
      }),
      remove: vi.fn().mockResolvedValue(true),
    };
    mockCredentialStore = {
      saveApiKey: vi.fn().mockResolvedValue(true),
      getApiKey: vi.fn().mockResolvedValue('secure-key'),
      deleteApiKey: vi.fn().mockResolvedValue(true),
    };
    mockManager = {
      // A already-authenticated, single-company client stub.
      getClient: vi.fn().mockResolvedValue({
        activeUid: 1,
        isMultiCompany: false,
        accessibleCompanyIds: [1],
        authenticate: vi.fn().mockResolvedValue(1),
      }),
      setDefault: vi.fn(),
    };
  });

  describe('setupInstance', () => {
    it('should authenticate and save configuration', async () => {
      const result = await setupInstance(mockConfigStore, mockCredentialStore, {
        alias: 'staging',
        url: 'https://staging.com',
        db: 'stg',
        username: 'dev',
        api_key: 'new-key'
      });

      expect(result).toContain("Successfully updated Odoo instance 'staging' (Odoo v18)");
      expect(mockCredentialStore.saveApiKey).toHaveBeenCalledWith('staging', 'new-key');
      expect(mockConfigStore.save).toHaveBeenCalled();
    });

    it('should throw error if required fields are missing', async () => {
      await expect(setupInstance(mockConfigStore, mockCredentialStore, {
        alias: 'new',
        url: 'https://new.com'
        // Missing db, username, api_key
      })).rejects.toThrow(/Incomplete configuration/);
    });
  });

  describe('listInstances', () => {
    it('should return a list of configured instances', async () => {
      const result = await listInstances(mockConfigStore);
      expect(result).toHaveLength(1);
      expect(result[0].alias).toBe('prod');
    });

    it('should return a message if no instances are configured', async () => {
      mockConfigStore.load.mockResolvedValue([]);
      const result = await listInstances(mockConfigStore);
      expect(result).toContain('No Odoo instances configured');
    });
  });

  describe('switchInstance', () => {
    it('should verify existence, set default, and report single-company scope', async () => {
      const result = await switchInstance(mockManager, { alias: 'prod' });
      expect(result).toContain("Instance switched to 'prod'");
      expect(result).toContain('SINGLE-COMPANY');
      expect(mockManager.setDefault).toHaveBeenCalledWith('prod');
      expect(mockManager.getClient).toHaveBeenCalledWith('prod');
    });

    it('should eagerly authenticate when the client is not yet authenticated and report multi-company scope', async () => {
      const authenticate = vi.fn().mockResolvedValue(7);
      mockManager.getClient.mockResolvedValue({
        activeUid: null,
        isMultiCompany: true,
        accessibleCompanyIds: [1, 2, 3],
        authenticate,
      });
      const result = await switchInstance(mockManager, { alias: 'prod' });
      expect(authenticate).toHaveBeenCalledOnce();
      expect(result).toContain('MULTI-COMPANY (3 accessible companies)');
    });
  });

  describe('removeInstance', () => {
    it('should remove metadata and credentials', async () => {
      const result = await removeInstance(mockConfigStore, mockCredentialStore, { alias: 'prod' });
      expect(result).toContain("Successfully removed Odoo instance 'prod'");
      expect(mockConfigStore.remove).toHaveBeenCalledWith('prod');
      expect(mockCredentialStore.deleteApiKey).toHaveBeenCalledWith('prod');
    });

    it('should throw if instance does not exist', async () => {
      await expect(removeInstance(mockConfigStore, mockCredentialStore, { alias: 'nonexistent' }))
        .rejects.toThrow('Odoo instance alias not found: nonexistent');
    });

    it('should prevent removing the protected default instance if managed by env', async () => {
        process.env.ODOO_URL = 'something';
        await expect(removeInstance(mockConfigStore, mockCredentialStore, { alias: 'default' }))
          .rejects.toThrow(/cannot be removed/);
        delete process.env.ODOO_URL;
    });
  });

  describe('getInfo', () => {
    it('should return metadata about the extension and environment', async () => {
      mockManager.list = vi.fn().mockResolvedValue([{ alias: 'prod', url: 'https://prod.com' }]);
      mockManager.getClient = vi.fn().mockResolvedValue({ majorVersion: 18 });

      const result = await getInfo(mockManager);

      expect(result.extension.name).toBe('brass-monkey');
      expect(result.context.odoo_version).toBe('v18');
      expect(result.context.active_skills).toEqual([]);
      expect(result.environment.platform).toBe(process.platform);
    });
  });
});
