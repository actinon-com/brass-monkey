import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeRecord } from '../src/tools/write_record.js';

describe('writeRecord Orchestration', () => {
  let mockManager: any;
  let mockClient: any;
  let mockAudit: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    mockAudit = {
      logLocalAction: vi.fn(),
      formatWriteSnapshot: vi.fn().mockReturnValue('<p>Snapshot</p>'),
      postChatterMessage: vi.fn(),
      logSystemEvent: vi.fn(),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
      getAudit: vi.fn().mockResolvedValue(mockAudit),
    };
  });

  it('should broadcast string write to all languages when with_translations is true', async () => {
    // 1. Identify translatable fields
    mockClient.executeKw.mockResolvedValueOnce([{ name: 'name' }]); // transFieldRecs
    
    // 2. fetchTranslationMatrix for before snapshot
    mockClient.executeKw
      .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // matrix: fetch langs
      .mockResolvedValueOnce([{ id: 1, name: 'Old Apple' }]) // matrix: read en_US
      .mockResolvedValueOnce([{ id: 1, name: 'Old Pomme' }]); // matrix: read fr_FR

    // 3. applyBroadcastWrite calls
    mockClient.executeKw
      .mockResolvedValueOnce([{ code: 'en_US' }, { code: 'fr_FR' }]) // broadcast: fetch langs
      .mockResolvedValueOnce(1); // broadcast: main write success

    await writeRecord(mockManager, {
      model: 'product.template',
      id: 1,
      values: { name: 'New Apple' },
      justification: 'Test',
      with_translations: true
    });

    // Verify broadcast calls
    expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'New Apple' }], { context: { lang: 'en_US' } });
    expect(mockClient.executeKw).toHaveBeenCalledWith('product.template', 'write', [[1], { name: 'New Apple' }], { context: { lang: 'fr_FR' } });
  });
});
