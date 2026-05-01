import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRead } from '../src/tools/search_read.js';
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

  describe('searchRead', () => {
    it('should query Odoo and return records', async () => {
      mockClient.executeKw.mockResolvedValue([{ id: 1, name: 'Test' }]);
      const result = await searchRead(mockManager, { 
        model: 'res.partner', 
        domain: [['name', '=', 'Test']],
        fields: ['name']
      });
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should handle auto-categorization when fields is empty', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ modules: 'base' }]) // model info
        .mockResolvedValueOnce([
          { name: 'name', modules: 'base', compute: false },
          { name: 'x_custom', modules: 'studio', compute: false }
        ]) // fields info
        .mockResolvedValueOnce([{ id: 1, name: 'Test' }]); // search_read

      const result = await searchRead(mockManager, { model: 'res.partner' });
      
      expect(mockClient.executeKw).toHaveBeenNthCalledWith(3, 'res.partner', 'search_read', [[]], expect.objectContaining({
        fields: expect.arrayContaining(['name', 'id'])
      }));
    });
  });

  describe('aggregateRecords', () => {
    it('should call read_group with expected arguments', async () => {
      mockClient.executeKw.mockResolvedValue([{ __count: 5, state: 'draft' }]);
      
      const result = await aggregateRecords(mockManager, {
        model: 'sale.order',
        groupby: ['state'],
        domain: []
      });

      expect(mockClient.executeKw).toHaveBeenCalledWith('sale.order', 'read_group', [[], [], ['state']], expect.objectContaining({
        lazy: false
      }));
      expect(result[0].__count).toBe(5);
    });
  });

  describe('createRecord', () => {
    it('should create a record and log the justification', async () => {
      mockClient.executeKw.mockResolvedValue(101);
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
      mockClient.executeKw.mockResolvedValueOnce([{ name: 'Old Name' }]);
      mockClient.executeKw.mockResolvedValueOnce(true);
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
