import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';

/**
 * Zod schema for aggregate_records tool input.
 */
export const AggregateRecordsSchema = z.object({
  model: z.string().describe('Technical model name (e.g., "account.move.line")'),
  domain: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }, z.array(z.any()).default([])).describe('Odoo domain filter'),
  groupby: z.preprocess((val) => {
    if (typeof val === 'string') {
      if (val.startsWith('[')) {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return [val];
    }
    return val;
  }, z.array(z.string())).describe("Fields to group by. Use 'field:interval' for dates (e.g., 'date:month')."),
  fields: z.array(z.string()).optional().describe("Numeric/Monetary fields to aggregate (sum). Defaults to '__count'."),
  limit: z.coerce.number().optional().describe('Maximum number of groups to return'),
  offset: z.coerce.number().optional().describe('Number of groups to skip (for pagination)'),
  instance_alias: z.string().optional().describe('Optional alias of the Odoo instance to use.'),
});

export type AggregateRecordsInput = z.infer<typeof AggregateRecordsSchema>;

/**
 * Tool to perform Odoo server-side aggregations (Pivot/Graph style).
 * Wraps the 'read_group' RPC method to provide summarized data.
 */
export async function aggregateRecords(manager: InstanceManager, input: AggregateRecordsInput) {
  // Enforce schema parsing to apply defaults and preprocessors (prevents undefined domain/fields crashes)
  const parsedInput = AggregateRecordsSchema.parse(input);
  const { model, domain, groupby, fields, limit, offset, instance_alias } = parsedInput;
  const client = await manager.getClient(instance_alias);

  // Odoo read_group signature: (domain, fields, groupby, offset=0, limit=None, orderby=False, lazy=True)
  // We use lazy: false to get a flattened result set of all groupby levels.
  const options: any = {
    lazy: false,
    offset: offset || 0
  };
  if (limit !== undefined) {
    options.limit = limit;
  }

  const results = await client.executeKw(model, 'read_group', [domain, fields || [], groupby], options);

  // Post-process to maximize data density, strip __domain, and normalize __count to count
  const formattedResults = results.map((r: any) => {
    const { __domain, __count, ...rest } = r;
    const formatted: any = { ...rest };
    if (__count !== undefined) {
      formatted.count = __count;
    }
    return formatted;
  });

  return {
    model,
    groupby,
    count: formattedResults.length,
    offset: offset || 0,
    limit: limit || undefined,
    results: formattedResults
  };
}
