import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listModels } from '../src/tools/list_models.js';
import { inspectModel } from '../src/tools/inspect_model.js';

describe('Discovery Tools', () => {
  let mockClient: any;
  let mockManager: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
    };
  });

  describe('listModels', () => {
    it('should query ir.model and return a concise map', async () => {
      mockClient.executeKw.mockResolvedValue([
        { model: 'res.partner', name: 'Contact' },
        { model: 'sale.order', name: 'Sales Order' },
      ]);

      const result = await listModels(mockManager, { search_term: 'test' });
      
      expect(result).toEqual({
        'res.partner': 'Contact',
        'sale.order': 'Sales Order',
      });
      expect(mockClient.executeKw).toHaveBeenCalledWith(
        'ir.model', 
        'search_read', 
        [['|', ['model', 'ilike', 'test'], ['name', 'ilike', 'test']]],
        expect.any(Object)
      );
    });
  });

  describe('inspectModel', () => {
    it('should call fields_get and apply lean property encoding', async () => {
      mockClient.executeKw.mockResolvedValue({
        name: {
          type: 'char',
          string: 'Name',
          required: true,
          readonly: false,
          store: true,
        },
      });

      const result = await inspectModel(mockManager, { model: 'sale.order' });

      expect(result.name).toEqual({
        type: 'char',
        string: 'Name',
        properties: ['required'],
      });
    });
  });
});
