import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for aggregate_records tool input.
 */
export declare const AggregateRecordsSchema: z.ZodObject<{
    model: z.ZodString;
    domain: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodDefault<z.ZodArray<z.ZodAny>>>;
    groupby: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodArray<z.ZodString>>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AggregateRecordsInput = z.infer<typeof AggregateRecordsSchema>;
/**
 * Tool to perform Odoo server-side aggregations (Pivot/Graph style).
 * Wraps the 'read_group' RPC method to provide summarized data.
 */
export declare function aggregateRecords(manager: InstanceManager, input: AggregateRecordsInput): Promise<{
    model: string;
    groupby: string[];
    count: any;
    offset: number;
    limit: number | undefined;
    results: any;
}>;
