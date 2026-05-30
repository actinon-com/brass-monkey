import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRecords } from '../src/tools/search_records.js';
import { createRecord } from '../src/tools/create_record.js';
import { writeRecord } from '../src/tools/write_record.js';
import { unlinkRecord } from '../src/tools/unlink_record.js';
import { aggregateRecords } from '../src/tools/aggregate_records.js';

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
        leads: { '1': 'Test' },
        results: [{ id: 1, name: 'Test', write_date: '2026-05-28 12:00:00' }]
      });
    });

    it('should handle background cache warming when fields is empty', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ id: 10, name: 'Partner', modules: 'base', transient: false }]) // buildModelMetadata (ir.model)
        .mockResolvedValueOnce([{ module: 'base' }]) // buildModelMetadata (ir.model.data)
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
  });
});
