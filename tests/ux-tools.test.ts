import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMenu } from '../src/tools/get_menu.js';
import { getAction } from '../src/tools/get_action.js';
import { getView } from '../src/tools/get_view.js';

describe('UX & Navigation Tools', () => {
  let mockClient: any;
  let mockManager: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
      majorVersion: 16,
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
    };
  });

  describe('getMenu', () => {
    it('should return a list of formatted menus', async () => {
      mockClient.executeKw.mockResolvedValue([
        { id: 1, complete_name: 'Sales / Orders', action: '123,ir.actions.act_window' },
      ]);
      const result = await getMenu(mockManager, { search_term: 'Sales' });
      expect(result[0].name).toBe('Sales / Orders');
    });
  });

  describe('getAction', () => {
    it('should read and return act_window details', async () => {
      mockClient.executeKw.mockResolvedValue([{
        name: 'Quotations',
        res_model: 'sale.order',
      }]);
      const result = await getAction(mockManager, { action_id: 123 });
      expect(result.res_model).toBe('sale.order');
    });
  });

  describe('getView', () => {
    it('should use get_view for Odoo 16+', async () => {
      mockClient.majorVersion = 16;
      mockClient.executeKw.mockResolvedValue({ arch: '<form/>' });
      await getView(mockManager, { model: 'res.partner', view_type: 'form' });
      expect(mockClient.executeKw).toHaveBeenCalledWith('res.partner', 'get_view', [], expect.any(Object));
    });

    it('should use fields_view_get for older versions', async () => {
      mockClient.majorVersion = 15;
      mockClient.executeKw.mockResolvedValue({ arch: '<tree/>' });
      await getView(mockManager, { model: 'res.partner', view_type: 'tree' });
      expect(mockClient.executeKw).toHaveBeenCalledWith('res.partner', 'fields_view_get', [], expect.any(Object));
    });
  });
});
