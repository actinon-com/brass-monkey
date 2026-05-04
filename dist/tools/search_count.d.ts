import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for search_count tool input.
 */
export declare const SearchCountSchema: z.ZodObject<{
    model: z.ZodString;
    domain: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodDefault<z.ZodArray<z.ZodAny>>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SearchCountInput = z.infer<typeof SearchCountSchema>;
/**
 * Tool to get the total number of records matching a domain.
 * Lightweight alternative to search_read when only the count is needed.
 */
export declare function searchCount(manager: InstanceManager, input: SearchCountInput): Promise<any>;
