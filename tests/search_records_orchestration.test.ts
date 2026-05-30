import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchRecords } from '../src/tools/search_records.js';

describe('searchRecords Orchestration', () => {
  let mockClient: any;
  let mockManager: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
    };
  });

  it('should construct high-signal pagination envelopes and handle parallel count', async () => {
    // 1. Mock search_read and search_count parallel returns
    mockClient.executeKw
      .mockResolvedValueOnce([
        { id: 10, name: 'SO0010', state: 'draft', write_date: '2026-05-28 10:00:00' },
        { id: 11, name: 'SO0011', state: 'sale', write_date: '2026-05-28 11:00:00' }
      ]) // search_read
      .mockResolvedValueOnce(2); // search_count

    const result = await searchRecords(mockManager, {
      model: 'sale.order',
      domain: [],
      fields: ['name', 'state', 'write_date']
    });

    expect(result).toEqual({
      model: 'sale.order',
      count: 2,
      total_count: 2,
      offset: 0,
      limit: 10,
      leads: {
        '10': 'SO0010',
        '11': 'SO0011'
      },
      results: [
        { id: 10, name: 'SO0010', state: 'draft', write_date: '2026-05-28 10:00:00' },
        { id: 11, name: 'SO0011', state: 'sale', write_date: '2026-05-28 11:00:00' }
      ]
    });
  });

  it('should fall back to intent-based case-insensitive ilike retry on empty name search', async () => {
    // 1. First run of parallel calls returns 0 records and 0 count
    mockClient.executeKw
      .mockResolvedValueOnce([]) // initial search_read
      .mockResolvedValueOnce(0) // initial search_count
      // 2. Intent-based retry calls with name ilike 'Test'
      .mockResolvedValueOnce([{ id: 101, name: 'Case Insensitive Test Record' }]) // retry search_read
      .mockResolvedValueOnce(1); // retry search_count

    const result = await searchRecords(mockManager, {
      model: 'res.partner',
      domain: [['name', '=', 'Test']],
      fields: ['name']
    });

    // Check that we retrieved the retried record successfully in single-turn
    expect(result.results).toEqual([{ id: 101, name: 'Case Insensitive Test Record' }]);
    expect(result.total_count).toBe(1);
    expect(result.leads).toEqual({ '101': 'Case Insensitive Test Record' });
  });
});
