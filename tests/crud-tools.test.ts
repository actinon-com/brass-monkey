import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRecords } from '../src/tools/search_records.js';
import { createRecord } from '../src/tools/create_record.js';
import { writeRecord } from '../src/tools/write_record.js';
import { unlinkRecord } from '../src/tools/unlink_record.js';
import { aggregateRecords } from '../src/tools/aggregate_records.js';
import { MetadataCache } from '../src/services/metadata-cache.js';

describe('CRUD Tools', () => {
  let mockClient: any;
  let mockAudit: any;
  let mockManager: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    mockAudit = {
      logSystemEvent: vi.fn().mockResolvedValue(true),
      postChatterMessage: vi.fn().mockResolvedValue(true),
      logLocalAction: vi.fn().mockResolvedValue(true),
      formatWriteSnapshot: vi.fn().mockReturnValue('Formatted Snapshot'),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
      getAudit: vi.fn().mockResolvedValue(mockAudit),
    };

    // Pre-seed MetadataCache to avoid any background RPC metadata calls in validateAndHeal
    const cache = MetadataCache.getInstance();
    cache.clear();
    cache.set('default', 'res.partner', {
      baseModule: 'base',
      id: 10,
      name: 'Partner',
      transient: false,
      modules: 'base',
      baseFields: ['id', 'name', 'write_date'],
      categorized: {
        base: {
          name: { type: 'char', string: 'Name' },
          write_date: { type: 'datetime', string: 'Modified' }
        },
        extended: {},
        computed: {},
        related: {},
        relational: {},
        lines: {}
      }
    });
  });

  describe('searchRecords', () => {
    it('should query Odoo in parallel and return the breadth envelope', async () => {
      // search_read returns records list, search_count returns count number
      mockClient.executeKw
        .mockResolvedValueOnce([{ id: 1, name: 'Test', write_date: '2026-05-28 12:00:00' }])
        .mockResolvedValueOnce(1); // search_count

      const result = await searchRecords(mockManager, { 
        model: 'res.partner', 
        domain: [['name', '=', 'Test']],
        fields: ['name', 'write_date']
      });

      expect(result).toEqual({
        model: 'res.partner',
        count: 1,
        total_count: 1,
        offset: 0,
        limit: 10,
        optimization_advice: [
          "SINGLE RECORD DETECTED: You retrieved a single record ID using search_records. This is highly inefficient. For single record lookups, you MUST use the 'get_record' tool, which provides a comprehensive 360-degree dashboard of sub-lines, relationships, display names, and chatter history in a single call."
        ],
        leads: { '1': 'Test' },
        results: [{ id: 1, name: 'Test', write_date: '2026-05-28 12:00:00' }]
      });
    });

    it('should handle background cache warming when fields is empty', async () => {
      // Clear the MetadataCache to force live metadata discovery
      MetadataCache.getInstance().clear();

      mockClient.executeKw
        .mockResolvedValueOnce([{ id: 10, name: 'Partner', modules: 'base', transient: false }]) // buildModelMetadata (ir.model)
        .mockResolvedValueOnce([{ module: 'base' }]) // buildModelMetadata (ir.model.data)
        .mockResolvedValueOnce({ name: {}, field_description: {}, ttype: {}, relation: {}, required: {}, readonly: {}, store: {}, translate: {}, company_dependent: {}, help: {}, domain: {}, modules: {}, compute: {}, related: {} }) // ir.model.fields fields_get probe (column availability)
        .mockResolvedValueOnce([
          { name: 'name', field_description: 'Name', ttype: 'char', required: false, readonly: false, store: true, translate: false, company_dependent: false, modules: 'base' },
          { name: 'write_date', field_description: 'Modified', ttype: 'datetime', required: false, readonly: false, store: true, translate: false, company_dependent: false, modules: 'base' }
        ]) // buildModelMetadata (ir.model.fields)
        .mockResolvedValueOnce([{ id: 1, name: 'Test' }]) // actual search_read
        .mockResolvedValueOnce(1); // actual search_count

      const result = await searchRecords(mockManager, { model: 'res.partner' });
      
      expect(result.results).toEqual([{ id: 1, name: 'Test' }]);
      expect(result.total_count).toBe(1);
    });
  });

  describe('aggregateRecords', () => {
    it('should call read_group with expected arguments and return structured metadata', async () => {
      mockClient.executeKw.mockResolvedValue([{ __count: 5, state: 'draft' }]);
      
      const result = await aggregateRecords(mockManager, {
        model: 'sale.order',
        groupby: ['state'],
        domain: []
      });

      expect(mockClient.executeKw).toHaveBeenCalledWith('sale.order', 'read_group', [[], [], ['state']], expect.objectContaining({
        lazy: false
      }));
      expect(result).toEqual({
        model: 'sale.order',
        groupby: ['state'],
        count: 1,
        offset: 0,
        limit: undefined,
        results: [{ count: 5, state: 'draft' }]
      });
    });
  });

  describe('createRecord', () => {
    it('should create a record and log the justification', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([]) // resolveFieldValues: fields search
        .mockResolvedValueOnce([{ code: 'en_US' }]) // applyBroadcastWrite: langs search
        .mockResolvedValueOnce(101); // applyBroadcastWrite: main create call
      
      const result = await createRecord(mockManager, {
        model: 'res.partner',
        values: { name: 'New Partner' },
        justification: 'New customer onboarding',
      });
      expect(result).toBe(101);
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith('create', 'res.partner', 101, expect.any(Object), 'New customer onboarding');
    });

    it('should pre-process stringified JSON values', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([]) // resolveFieldValues: fields search
        .mockResolvedValueOnce([{ code: 'en_US' }]) // applyBroadcastWrite: langs search
        .mockResolvedValueOnce(102); // applyBroadcastWrite: main create call

      const result = await createRecord(mockManager, {
        model: 'res.partner',
        values: JSON.stringify({ name: 'New Partner via JSON' }) as any,
        justification: 'New customer onboarding with JSON string',
      });
      expect(result).toBe(102);
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith(
        'create', 
        'res.partner', 
        102, 
        expect.objectContaining({ name: 'New Partner via JSON' }), 
        'New customer onboarding with JSON string'
      );
    });
  });

  describe('writeRecord', () => {
    it('should capture snapshot, write, and post to chatter', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([]) // resolveFieldValues: fields search
        .mockResolvedValueOnce([{ name: 'Old Name' }]) // writeRecord: before snapshot read
        .mockResolvedValueOnce([{ code: 'en_US' }]) // applyBroadcastWrite: langs search
        .mockResolvedValueOnce(true); // applyBroadcastWrite: main write call

      await writeRecord(mockManager, {
        model: 'res.partner',
        id: 1,
        values: { name: 'New Name' },
        justification: 'Typo correction',
      });
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith('write', 'res.partner', 1, expect.any(Object), 'Typo correction');
    });

    it('should pre-process stringified JSON values and coerce id from string', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([]) // resolveFieldValues: fields search
        .mockResolvedValueOnce([{ name: 'Old Name' }]) // writeRecord: before snapshot read
        .mockResolvedValueOnce([{ code: 'en_US' }]) // applyBroadcastWrite: langs search
        .mockResolvedValueOnce(true); // applyBroadcastWrite: main write call

      await writeRecord(mockManager, {
        model: 'res.partner',
        id: '123' as any,
        values: JSON.stringify({ name: 'New Name via JSON' }) as any,
        justification: 'Typo correction with JSON string',
      });
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith(
        'write', 
        'res.partner', 
        123, 
        expect.any(Object), 
        'Typo correction with JSON string'
      );
    });
  });

  describe('unlinkRecord', () => {
    it('should delete record and log warning', async () => {
      mockClient.executeKw.mockResolvedValue(true);
      const success = await unlinkRecord(mockManager, {
        model: 'res.partner',
        id: 1,
        justification: 'Data cleanup',
      });

      expect(success).toBe(true);
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith('unlink', 'res.partner', 1, null, 'Data cleanup');
    });

    it('should coerce id from string to number', async () => {
      mockClient.executeKw.mockResolvedValue(true);
      const success = await unlinkRecord(mockManager, {
        model: 'res.partner',
        id: '456' as any,
        justification: 'Data cleanup with string ID',
      });

      expect(success).toBe(true);
      expect(mockAudit.logLocalAction).toHaveBeenCalledWith('unlink', 'res.partner', 456, null, 'Data cleanup with string ID');
    });
  });
});
