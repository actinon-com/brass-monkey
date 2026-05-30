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
    it('should return a list of formatted menus inside a structured metadata envelope', async () => {
      mockClient.executeKw.mockResolvedValue([
        { id: 1, name: 'Orders', complete_name: 'Sales / Orders', action: '123,ir.actions.act_window', parent_id: [10, 'Sales'], child_id: [] },
      ]);
      const result = await getMenu(mockManager, { search_term: 'Sales' });
      
      expect(result).toEqual({
        parent_id: undefined,
        search_term: 'Sales',
        count: 1,
        results: [
          {
            id: 1,
            name: 'Orders',
            complete_name: 'Sales / Orders',
            action: { id: 123, type: 'ir.actions.act_window' },
            parent_id: 10,
            has_children: false,
            children_count: 0
          }
        ]
      });
    });
  });

  describe('getAction', () => {
    it('should dynamically auto-resolve action model, read, and return views/menus', async () => {
      // 1. ir.actions.actions type lookup mock
      // 2. parallel Promise.all mock: [action records, bound menus]
      // 3. parallel act_window.view search_read mock
      mockClient.executeKw
        .mockResolvedValueOnce([{ type: 'ir.actions.act_window' }]) // type lookup
        .mockResolvedValueOnce([{ name: 'Quotations', res_model: 'sale.order', view_mode: 'tree,form', view_ids: [40, 41] }]) // action read
        .mockResolvedValueOnce([{ complete_name: 'Sales / Orders / Quotations' }]) // bound menus search
        .mockResolvedValueOnce([
          { view_id: [40, 'List View'], view_mode: 'tree' },
          { view_id: [41, 'Form View'], view_mode: 'form' }
        ]); // views meta search

      const result = await getAction(mockManager, { action_id: 123 });

      expect(result).toEqual({
        id: 123,
        type: 'ir.actions.act_window',
        name: 'Quotations',
        res_model: 'sale.order',
        view_mode: 'tree,form',
        view_id: undefined,
        views: {
          tree: 40,
          form: 41
        },
        menus: [
          'Sales / Orders / Quotations'
        ]
      });
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
