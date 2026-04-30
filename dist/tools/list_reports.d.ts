import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for list_reports tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export declare const ListReportsSchema: z.ZodObject<{
    model: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
    search_term: z.ZodOptional<z.ZodString>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListReportsInput = z.infer<typeof ListReportsSchema>;
/**
 * Tool to list Odoo reports for a specific model.
 * @param manager The InstanceManager instance.
 * @param input The ListReportsInput parameters.
 * @returns An array of report objects.
 */
export declare function listReports(manager: InstanceManager, input: ListReportsInput): Promise<any>;
