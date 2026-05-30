import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for list_models tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export declare const ListModelsSchema: z.ZodObject<{
    search_term: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ListModelsInput = z.infer<typeof ListModelsSchema>;
/**
 * Tool to list Odoo technical models.
 * Enhances the output with Skill Gate breadcrumbs to guide the agent.
 */
export declare function listModels(manager: InstanceManager, input?: ListModelsInput): Promise<{
    search_term: string | undefined;
    count: any;
    results: any;
}>;
