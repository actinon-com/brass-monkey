import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRead } from '../src/tools/search_read.js';
import { createRecord } from '../src/tools/create_record.js';
import { writeRecord } from '../src/tools/write_record.js';
import { unlinkRecord } from '../src/tools/unlink_record.js';

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
        domain: [['name', '=', 'Test']] 
      });
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
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
      expect(mockAudit.logSystemEvent).toHaveBeenCalledWith(expect.stringContaining('Created res.partner(101)'));
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
      expect(mockAudit.postChatterMessage).toHaveBeenCalledWith('res.partner', 1, 'Formatted Snapshot');
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
      expect(mockAudit.logSystemEvent).toHaveBeenCalledWith('Deleted res.partner(1): Data cleanup', 'warning');
    });
  });
});
