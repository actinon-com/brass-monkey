import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_menu tool input.
 */
export declare const GetMenuSchema: z.ZodObject<{
    parent_id: z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>>;
    search_term: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetMenuInput = z.infer<typeof GetMenuSchema>;
interface MenuNode {
    id: number;
    name: string;
    complete_name?: string;
    action: {
        id: number;
        type: string;
    } | null;
    parent_id: number | null;
    children: MenuNode[];
    children_count?: number;
}
/**
 * Tool to retrieve Odoo menu hierarchy.
 * Generates an extremely dense, pruned recursive JSON tree for both search and navigation.
 */
export declare function getMenu(manager: InstanceManager, input?: GetMenuInput): Promise<{
    search_term: string;
    count: any;
    results: MenuNode[];
    parent_id?: undefined;
} | {
    parent_id: number;
    count: number;
    results: MenuNode[];
    search_term?: undefined;
} | {
    count: number;
    results: MenuNode[];
    search_term?: undefined;
    parent_id?: undefined;
}>;
export {};
