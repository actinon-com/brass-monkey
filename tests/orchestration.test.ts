import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OdooOrchestrator } from '../src/services/odoo-orchestrator.js';
import { inspectModel } from '../src/tools/inspect_model.js';

describe('OdooOrchestrator', () => {
  let mockClient: any;
  let orchestrator: OdooOrchestrator;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    orchestrator = new OdooOrchestrator(mockClient as any);
  });

  describe('fetchTranslationMatrix', () => {
    it('should simplify convergent translations to a single string', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // langs
        .mockResolvedValueOnce([{ id: 1, name: 'Product' }]) // read en_US
        .mockResolvedValueOnce([{ id: 1, name: 'Product' }]); // read fr_FR

      const result = await orchestrator.fetchTranslationMatrix('product.template', [1], ['name']);
      
      expect(result[1].name).toBe('Product');
      expect(mockClient.executeKw).toHaveBeenCalledTimes(3);
    });

    it('should expand divergent translations into a matrix', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }, { code: 'de_DE' }]) // langs
        .mockResolvedValueOnce([{ id: 1, name: 'Apple' }]) // read en_US
        .mockResolvedValueOnce([{ id: 1, name: 'Pomme' }]) // read fr_FR
        .mockResolvedValueOnce([{ id: 1, name: 'Apple' }]); // read de_DE

      const result = await orchestrator.fetchTranslationMatrix('product.template', [1], ['name']);
      
      expect(Array.isArray(result[1].name)).toBe(true);
      expect(result[1].name).toContainEqual({ value: 'Apple', langs: [] });
      expect(result[1].name).toContainEqual({ value: 'Pomme', langs: ['fr_FR'] });
    });

    it('should handle restricted res.lang access gracefully', async () => {
      mockClient.executeKw.mockRejectedValue(new Error('Access Denied'));
      
      const result = await orchestrator.fetchTranslationMatrix('product.template', [1], ['name']);
      expect(result).toEqual({});
    });
  });

  describe('resolveFieldValues', () => {
    beforeEach(() => {
      mockClient.executeKw.mockResolvedValue([
        { name: 'partner_id', ttype: 'many2one', relation: 'res.partner' },
        { name: 'tag_ids', ttype: 'many2many', relation: 'res.partner.category' },
        { name: 'order_line', ttype: 'one2many', relation: 'sale.order.line' },
        { name: 'name', ttype: 'char' }
      ]);
    });

    it('should resolve Many2one name to ID', async () => {
      mockClient.executeKw.mockResolvedValueOnce([{ name: 'partner_id', ttype: 'many2one', relation: 'res.partner' }]);
      mockClient.executeKw.mockResolvedValueOnce([[10, 'Azure Interior']]); // name_search result

      const result = await orchestrator.resolveFieldValues('res.partner', { partner_id: 'Azure Interior' });
      expect(result.partner_id).toBe(10);
    });

    it('should throw error for ambiguous Many2one resolution', async () => {
      mockClient.executeKw.mockResolvedValueOnce([{ name: 'partner_id', ttype: 'many2one', relation: 'res.partner' }]);
      mockClient.executeKw.mockResolvedValueOnce([[10, 'Azure'], [20, 'Azure 2']]); // Multiple matches

      await expect(orchestrator.resolveFieldValues('res.partner', { partner_id: 'Azure' }))
        .rejects.toThrow(/Ambiguous resolution/);
    });

    it('should convert lists of objects to One2many command tuples', async () => {
      const values = {
        order_line: [
          { product_id: 1, qty: 1 },
          { product_id: 2, qty: 5 }
        ]
      };
      const result = await orchestrator.resolveFieldValues('sale.order', values);
      expect(result.order_line).toEqual([
        [0, 0, { product_id: 1, qty: 1 }],
        [0, 0, { product_id: 2, qty: 5 }]
      ]);
    });

    it('should convert lists of IDs to Many2many command tuples', async () => {
      const values = { tag_ids: [1, 2, 3] };
      const result = await orchestrator.resolveFieldValues('res.partner', values);
      expect(result.tag_ids).toEqual([
        [4, 1, 0],
        [4, 2, 0],
        [4, 3, 0]
      ]);
    });
  });

  describe('applyBroadcastWrite', () => {
    it('should broadcast a simple string write to all languages', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // langs
        .mockResolvedValueOnce(1); // create/write success

      await orchestrator.applyBroadcastWrite('product.template', 1, { name: 'New Name' }, ['name']);

      // 1. fetch langs
      // 2. main write
      // 3. write en_US
      // 4. write fr_FR
      expect(mockClient.executeKw).toHaveBeenCalledTimes(4);
      
      // Verify main write
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'New Name' }]);
      
      // Verify translation writes
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'New Name' }], { context: { lang: 'en_US' } });
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'New Name' }], { context: { lang: 'fr_FR' } });
    });

    it('should target specific languages when provided with a matrix', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // langs
        .mockResolvedValueOnce(1); // main write success

      const values = {
        name: [
          { value: 'Apple', langs: [] },
          { value: 'Pomme', langs: ['fr_FR'] }
        ]
      };

      await orchestrator.applyBroadcastWrite('product.template', 1, values, ['name']);

      // Verify main write (uses fallback)
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'Apple' }]);
      
      // Verify translation writes
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'Apple' }], { context: { lang: 'en_US' } });
      expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'Pomme' }], { context: { lang: 'fr_FR' } });
    });
  });
});

describe('Orchestrated Introspection', () => {
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

  it('should include translatable flag and search hints for relational fields', async () => {
    mockClient.executeKw
      .mockResolvedValueOnce([{ id: 100, modules: 'base', name: 'Partner', transient: false }]) // model info
      .mockResolvedValueOnce([{ module: 'base' }]) // resolveBaseModule (ir.model.data)
      .mockResolvedValueOnce([
        { 
          name: 'name', 
          field_description: 'Name', 
          ttype: 'char', 
          translate: true, 
          modules: 'base',
          store: true
        },
        { 
          name: 'parent_id', 
          field_description: 'Parent', 
          ttype: 'many2one', 
          relation: 'res.partner', 
          domain: "[('is_company', '=', True)]", 
          modules: 'base',
          store: true
        }
      ]); // field info

    const result = await inspectModel(mockManager, { model: 'res.partner', show_base: true });
    
    expect(result.fields.base.name.properties).toContain('translatable');
    expect(result.fields.base.parent_id.hint).toBe("Search Filter: [('is_company', '=', True)]");
  });
});
