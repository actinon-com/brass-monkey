import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstanceManager } from '../src/services/instance-manager.js';

describe('InstanceManager', () => {
  let mockConfigStore: any;
  let mockCredentialStore: any;
  let manager: InstanceManager;

  beforeEach(() => {
    mockConfigStore = {
      load: vi.fn().mockResolvedValue([
        { alias: 'prod', url: 'https://prod.com', db: 'db', username: 'admin' }
      ]),
    };
    mockCredentialStore = {
      getApiKey: vi.fn().mockResolvedValue('secure-key'),
    };
    manager = new InstanceManager(mockConfigStore, mockCredentialStore);
  });

  it('should initialize client with secure key', async () => {
    const client = await manager.getClient('prod');
    expect(mockCredentialStore.getApiKey).toHaveBeenCalledWith('prod');
    expect((client as any).config.api_key).toBe('secure-key');
  });

  it('should throw if secure key is missing', async () => {
    mockCredentialStore.getApiKey.mockResolvedValue(null);
    await expect(manager.getClient('prod')).rejects.toThrow('Secure API key not found');
  });
});
