import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for search_records tool input.
 * Fully pre-processed and optimized.
 */
export declare const SearchRecordsSchema: z.ZodObject<{
    model: z.ZodString;
    domain: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodDefault<z.ZodArray<z.ZodAny>>>;
    fields: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodOptional<z.ZodArray<z.ZodString>>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    order: z.ZodOptional<z.ZodString>;
    with_translations: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SearchRecordsInput = z.infer<typeof SearchRecordsSchema>;
/**
 * Tool to search for Odoo records.
 * Returns a pagination envelope containing total matching count and display display-name mapping.
 */
export declare function searchRecords(manager: InstanceManager, input: SearchRecordsInput): Promise<{
    isError: boolean;
    message: string;
    diagnostic_hints: {
        invalid_field?: string;
        invalid_operator?: string;
        target_model: string;
        did_you_mean_substrings?: string[];
        action_directives: string[];
        explanation?: string;
    };
} | {
    leads: any;
    results: any;
    optimization_advice?: string[] | undefined;
    model: string;
    count: any;
    total_count: any;
    offset: number;
    limit: number;
}>;
