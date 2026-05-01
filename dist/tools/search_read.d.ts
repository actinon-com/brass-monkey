import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for search_read tool input.
 * Includes pre-processing to be more forgiving of agent formatting errors.
 */
export declare const SearchReadSchema: z.ZodObject<{
    model: z.ZodString;
    domain: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodDefault<z.ZodArray<z.ZodAny>>>;
    fields: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodOptional<z.ZodArray<z.ZodString>>>;
    include_extended: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_computed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    order: z.ZodOptional<z.ZodString>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SearchReadInput = z.infer<typeof SearchReadSchema>;
/**
 * Tool to search and read Odoo records.
 * Automatically handles field categorization to prevent context window flooding.
 */
export declare function searchRead(manager: InstanceManager, input: SearchReadInput): Promise<any>;
