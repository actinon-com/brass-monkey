import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listReports } from '../src/tools/list_reports.js';
import { downloadReport } from '../src/tools/download_report.js';
import * as fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('Report Tools', () => {
  let mockClient: any;
  let mockAudit: any;
  let mockManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      executeKw: vi.fn(),
    };
    mockAudit = {
      logSystemEvent: vi.fn().mockResolvedValue(true),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
      getAudit: vi.fn().mockResolvedValue(mockAudit),
    };
  });

  describe('listReports', () => {
    it('should query ir.actions.report and return a list', async () => {
      mockClient.executeKw.mockResolvedValue([
        { id: 1, name: 'Invoices', report_name: 'account.report_invoice' },
      ]);
      const result = await listReports(mockManager, { model: 'account.move' });
      expect(result[0].name).toBe('Invoices');
    });
  });

  describe('downloadReport', () => {
    it('should call Odoo to render PDF and save locally', async () => {
      mockClient.executeKw.mockResolvedValue(['dGVzdA==', 'pdf']);
      const destination = 'C:/Users/me/Downloads/test.pdf';
      await downloadReport(mockManager, {
        report_id: 1,
        record_ids: [101],
        destination_path: destination,
        justification: 'Exporting for audit',
      });
      expect(fs.writeFile).toHaveBeenCalledWith(destination, expect.any(Buffer));
    });

    it('should throw error for relative paths', async () => {
      await expect(downloadReport(mockManager, {
        report_id: 1,
        record_ids: [101],
        destination_path: 'relative/path.pdf',
        justification: 'should fail',
      })).rejects.toThrow('must be an absolute path');
    });
  });
});
