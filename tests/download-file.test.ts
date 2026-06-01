import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadFile } from '../src/tools/download_file.js';
import * as fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('Download File Tool', () => {
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

  it('should retrieve base64 content from Odoo and write it as a local file', async () => {
    // Mock Odoo 'read' method returning base64 data for 'datas'
    // "test content" base64 is dGVzdCBjb250ZW50
    mockClient.executeKw.mockResolvedValue([{ id: 42, datas: 'dGVzdCBjb250ZW50' }]);

    const destination = path.resolve('/tmp/test-attachment.txt');
    const result = await downloadFile(mockManager, {
      model: 'ir.attachment',
      res_id: 42,
      field: 'datas',
      destination_path: destination,
      justification: 'Downloading invoice receipt for audit proof',
    });

    expect(mockClient.executeKw).toHaveBeenCalledWith('ir.attachment', 'read', [[42], ['datas']]);
    expect(fs.writeFile).toHaveBeenCalledWith(destination, Buffer.from('test content'));
    expect(mockAudit.logSystemEvent).toHaveBeenCalledWith(
      expect.stringContaining("Downloaded file from model 'ir.attachment' ID 42 field 'datas'")
    );
    expect(result).toBe(destination);
  });

  it('should use default values for model and field when omitted', async () => {
    mockClient.executeKw.mockResolvedValue([{ id: 42, datas: 'dGVzdCBjb250ZW50' }]);

    const destination = path.resolve('/tmp/test-attachment-default.txt');
    await downloadFile(mockManager, {
      res_id: 42,
      destination_path: destination,
      justification: 'Default check',
    });

    expect(mockClient.executeKw).toHaveBeenCalledWith('ir.attachment', 'read', [[42], ['datas']]);
  });

  it('should throw an error if the record does not exist', async () => {
    mockClient.executeKw.mockResolvedValue([]);

    const destination = path.resolve('/tmp/non-existent.txt');
    await expect(downloadFile(mockManager, {
      model: 'ir.attachment',
      res_id: 999,
      field: 'datas',
      destination_path: destination,
      justification: 'Failure test',
    })).rejects.toThrow("Record with ID 999 not found in model ir.attachment");
  });

  it('should throw an error if the binary field is empty or false', async () => {
    mockClient.executeKw.mockResolvedValue([{ id: 42, datas: false }]);

    const destination = path.resolve('/tmp/empty-field.txt');
    await expect(downloadFile(mockManager, {
      model: 'ir.attachment',
      res_id: 42,
      field: 'datas',
      destination_path: destination,
      justification: 'Failure test empty',
    })).rejects.toThrow("Field 'datas' is empty or not present on record 42 in model ir.attachment");
  });

  it('should throw an error for a relative path', async () => {
    await expect(downloadFile(mockManager, {
      model: 'ir.attachment',
      res_id: 42,
      field: 'datas',
      destination_path: 'relative/path.txt',
      justification: 'Failure test path',
    })).rejects.toThrow("must be an absolute path");
  });
});
