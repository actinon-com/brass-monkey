import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { MetadataCache } from '../services/metadata-cache.js';
import { buildModelMetadata } from '../services/metadata-resolver.js';
import { OdooOrchestrator } from '../services/odoo-orchestrator.js';
import { DomainValidationService } from '../services/domain-validator.js';

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
  // Enforce schema parsing to apply defaults and preprocessors
  const parsedInput = SearchRecordsSchema.parse(input);
  const { model, domain, fields, limit, offset, order, with_translations, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);
  const alias = instance_alias || 'default';

  // Validate and Heal Domain using decoupled DomainValidationService
  const validationResult = await DomainValidationService.validateAndHeal(client, model, domain, alias);
  if (!validationResult.success && validationResult.errorPayload) {
    return validationResult.errorPayload;
  }
  const activeDomain = validationResult.healedDomain || domain;

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
    client.executeKw(model, 'search_read', [activeDomain], {
      fields: readFields,
      limit: targetLimit,
      offset: targetOffset,
      order,
    }),
    client.executeKw(model, 'search_count', [activeDomain])
  ]);

  // Intent-Based Search Expansion: If zero results and domain has a name filter, retry with ilike
  let activeRecords = records;
  let activeTotalCount = totalCount;
  if (activeRecords.length === 0 && activeDomain.length > 0) {
    const nameFilterIndex = activeDomain.findIndex((d: any) => Array.isArray(d) && d[0] === 'name' && d[1] === '=');
    if (nameFilterIndex !== -1) {
      const expandedDomain = [...activeDomain];
      expandedDomain[nameFilterIndex] = ['name', 'ilike', activeDomain[nameFilterIndex][2]];
      
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
  const advice: string[] = [];
  if (targetLimit === 1 || activeRecords.length === 1) {
    advice.push(
      "SINGLE RECORD DETECTED: You retrieved a single record ID using search_records. This is highly inefficient. For single record lookups, you MUST use the 'get_record' tool, which provides a comprehensive 360-degree dashboard of sub-lines, relationships, display names, and chatter history in a single call."
    );
  }
  if (targetLimit >= 100) {
    advice.push(
      "POTENTIAL LOCAL CALCULATION LOOP: You retrieved 100 or more records. If you are calculating sums, averages, grouping, or counting records locally, this is extremely slow and overuses token/API limits. You MUST use 'aggregate_records' for server-side, high-performance database-level calculations instead."
    );
  }

  return {
    model,
    count: activeRecords.length,
    total_count: activeTotalCount,
    offset: targetOffset,
    limit: targetLimit,
    ...(advice.length > 0 ? { optimization_advice: advice } : {}),
    leads: activeRecords.reduce((acc: Record<string, string>, r: any) => {
      acc[String(r.id)] = r.display_name || r.name || `ID ${r.id}`;
      return acc;
    }, {} as Record<string, string>),
    results: activeRecords
  };
}
