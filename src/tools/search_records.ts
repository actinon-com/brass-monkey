import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { MetadataCache } from '../services/metadata-cache.js';
import { buildModelMetadata } from '../services/metadata-resolver.js';
import { OdooOrchestrator } from '../services/odoo-orchestrator.js';

/**
 * Zod schema for search_records tool input.
 * Fully pre-processed and optimized.
 */
export const SearchRecordsSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "res.partner", "project.task")'),
  domain: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }, z.array(z.any()).default([])).describe('Odoo domain filter array'),
  fields: z.preprocess((val) => {
    if (typeof val === 'string') {
      if (val.startsWith('[')) {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return [val];
    }
    return val;
  }, z.array(z.string()).optional()).describe('Optional explicit list of fields to retrieve.'),
  limit: z.coerce.number().optional().describe('Maximum number of records to return (defaults to 10)'),
  offset: z.coerce.number().optional().describe('Number of records to skip (for pagination)'),
  order: z.string().optional().describe('Sort order (e.g., "id desc", "write_date desc")'),
  with_translations: z.boolean().optional().default(false).describe("If True, translatable fields are enriched with their 'Forgiving' format."),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type SearchRecordsInput = z.infer<typeof SearchRecordsSchema>;

/**
 * Tool to search for Odoo records.
 * Returns a pagination envelope containing total matching count and display display-name mapping.
 */
export async function searchRecords(manager: InstanceManager, input: SearchRecordsInput) {
  const { model, domain = [], fields, limit, offset, order, with_translations, instance_alias } = input;
  const client = await manager.getClient(instance_alias);
  const alias = instance_alias || 'default';

  let readFields = fields;

  // 1. Resolve and cache metadata if fields are not specified (Breadth Default)
  if (!readFields || readFields.length === 0) {
    const cache = MetadataCache.getInstance();
    let metadata = cache.get(alias, model);

    if (!metadata) {
      metadata = await buildModelMetadata(client, model, alias);
      cache.set(alias, model, metadata);
    }
    readFields = metadata.baseFields;
  }

  // 2. Perform parallel search_read and search_count queries for zero N+1 latency
  const targetLimit = limit || 10;
  const targetOffset = offset || 0;

  const [records, totalCount] = await Promise.all([
    client.executeKw(model, 'search_read', [domain], {
      fields: readFields,
      limit: targetLimit,
      offset: targetOffset,
      order,
    }),
    client.executeKw(model, 'search_count', [domain])
  ]);

  // Intent-Based Search Expansion: If zero results and domain has a name filter, retry with ilike
  let activeRecords = records;
  let activeTotalCount = totalCount;
  if (activeRecords.length === 0 && domain.length > 0) {
    const nameFilterIndex = domain.findIndex((d: any) => Array.isArray(d) && d[0] === 'name' && d[1] === '=');
    if (nameFilterIndex !== -1) {
      const expandedDomain = [...domain];
      expandedDomain[nameFilterIndex] = ['name', 'ilike', domain[nameFilterIndex][2]];
      
      const [expandedRecords, expandedCount] = await Promise.all([
        client.executeKw(model, 'search_read', [expandedDomain], {
          fields: readFields,
          limit: targetLimit,
          offset: targetOffset,
          order,
        }),
        client.executeKw(model, 'search_count', [expandedDomain])
      ]);

      if (expandedRecords.length > 0) {
        activeRecords = expandedRecords;
        activeTotalCount = expandedCount;
      }
    }
  }

  // 3. Translate if requested
  if (with_translations && activeRecords.length > 0) {
    const orchestrator = new OdooOrchestrator(client);
    const transFieldRecs = await client.executeKw('ir.model.fields', 'search_read', [[
      ['model_id.model', '=', model],
      ['name', 'in', readFields],
      ['translate', '=', true]
    ]], { fields: ['name'] });
    const transFieldNames = transFieldRecs.map((f: any) => f.name);

    if (transFieldNames.length > 0) {
      const resIds = activeRecords.map((r: any) => r.id);
      const matrix = await orchestrator.fetchTranslationMatrix(model, resIds, transFieldNames);
      for (const rec of activeRecords) {
        if (matrix[rec.id]) {
          Object.assign(rec, matrix[rec.id]);
        }
      }
    }
  }

  // 4. Construct high-signal Breadth Envelope
  return {
    model,
    count: activeRecords.length,
    total_count: activeTotalCount,
    offset: targetOffset,
    limit: targetLimit,
    leads: activeRecords.reduce((acc: Record<string, string>, r: any) => {
      acc[String(r.id)] = r.display_name || r.name || `ID ${r.id}`;
      return acc;
    }, {} as Record<string, string>),
    results: activeRecords
  };
}
