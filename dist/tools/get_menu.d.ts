import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_menu tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export declare const GetMenuSchema: z.ZodObject<{
    search_term: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetMenuInput = z.infer<typeof GetMenuSchema>;
/**
 * Tool to retrieve Odoo menu hierarchy.
 * @param manager The InstanceManager instance.
 * @param input The GetMenuInput parameters.
 * @returns An array of menu items with their complete names and associated actions.
 */
export declare function getMenu(manager: InstanceManager, input?: GetMenuInput): Promise<any>;
