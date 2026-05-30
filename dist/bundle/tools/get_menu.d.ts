import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_menu tool input.
 */
export declare const GetMenuSchema: z.ZodObject<{
    parent_id: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>>;
    search_term: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetMenuInput = z.infer<typeof GetMenuSchema>;
/**
 * Tool to retrieve Odoo menu hierarchy.
 * Supports hierarchical parent drilling and full ancestral path search.
 */
export declare function getMenu(manager: InstanceManager, input?: GetMenuInput): Promise<{
    parent_id: number | undefined;
    search_term: string | undefined;
    count: any;
    results: any;
}>;
