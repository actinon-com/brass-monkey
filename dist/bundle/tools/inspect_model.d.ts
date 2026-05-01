import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for inspect_model tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export declare const InspectModelSchema: z.ZodObject<{
    model: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InspectModelInput = z.infer<typeof InspectModelSchema>;
/**
 * Tool to inspect an Odoo model with "Lean Property Encoding".
 * @param manager The InstanceManager instance.
 * @param input The InspectModelInput parameters.
 * @returns An optimized map of model fields and their technical attributes.
 */
export declare function inspectModel(manager: InstanceManager, input: InspectModelInput): Promise<Record<string, any>>;
