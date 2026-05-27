import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRead } from '../src/tools/search_read.js';

describe('searchRead Orchestration', () => {
  let mockManager: any;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
    };
  });

  it('should enrich translatable fields when with_translations is true', async () => {
    // 1. search_read for records
    mockClient.executeKw.mockResolvedValueOnce([{ id: 1, name: 'Apple' }]);
    
    // 2. Identify translatable fields
    mockClient.executeKw.mockResolvedValueOnce([{ name: 'name' }]);
    
    // 3. fetchTranslationMatrix calls
    mockClient.executeKw
      .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // langs
      .mockResolvedValueOnce([{ id: 1, name: 'Apple' }]) // read en_US
      .mockResolvedValueOnce([{ id: 1, name: 'Pomme' }]); // read fr_FR

    const result = await searchRead(mockManager, { 
      model: 'product.template', 
      fields: ['name'], 
      with_translations: true 
    });

    expect(result[0].name).toContainEqual({ value: 'Apple', langs: [] });
    expect(result[0].name).toContainEqual({ value: 'Pomme', langs: ['fr_FR'] });
  });

  it('should NOT enrich translatable fields when with_translations is false', async () => {
    mockClient.executeKw.mockResolvedValueOnce([{ id: 1, name: 'Apple' }]);

    const result = await searchRead(mockManager, { 
      model: 'product.template', 
      fields: ['name'], 
      with_translations: false 
    });

    expect(result[0].name).toBe('Apple');
    expect(mockClient.executeKw).toHaveBeenCalledTimes(1);
  });

  it('should retry with ilike if exact name match returns 0 results', async () => {
    // 1. Initial search with '=' returns []
    mockClient.executeKw.mockResolvedValueOnce([]);
    
    // 2. Expanded search with 'ilike' returns records
    mockClient.executeKw.mockResolvedValueOnce([{ id: 10, name: 'Azure Interior' }]);

    const result = await searchRead(mockManager, { 
      model: 'res.partner', 
      domain: [['name', '=', 'Azure']], 
      fields: ['name'] 
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Azure Interior');
    expect(mockClient.executeKw).toHaveBeenCalledWith('res.partner', 'search_read', [[['name', 'ilike', 'Azure']]], expect.any(Object));
  });
});
