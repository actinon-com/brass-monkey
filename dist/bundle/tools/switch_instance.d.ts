import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for switch_instance tool input.
 * Includes pre-processing to handle single-item arrays.
 */
export declare const SwitchInstanceSchema: z.ZodObject<{
    alias: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
}, z.core.$strip>;
export type SwitchInstanceInput = z.infer<typeof SwitchInstanceSchema>;
/**
 * Tool to set the default Odoo instance for the current session.
 * @param manager The InstanceManager instance.
 * @param input The SwitchInstanceInput parameters.
 * @returns Success message.
 */
export declare function switchInstance(manager: InstanceManager, input: SwitchInstanceInput): Promise<string>;
