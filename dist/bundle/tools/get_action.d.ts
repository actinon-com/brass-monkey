import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_action tool input.
 * Includes pre-processing to handle numeric strings.
 */
export declare const GetActionSchema: z.ZodObject<{
    action_id: z.ZodCoercedNumber<unknown>;
    action_type: z.ZodOptional<z.ZodString>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetActionInput = z.infer<typeof GetActionSchema>;
/**
 * Tool to retrieve Odoo action details (e.g., act_window, server actions).
 * Automatically resolves the correct Odoo actions model dynamically to prevent crashes.
 */
export declare function getAction(manager: InstanceManager, input: GetActionInput): Promise<{
    id: number;
    type: string;
    name: any;
    res_model: any;
    view_mode: any;
    view_id: any;
    domain: any;
    context: any;
    target: any;
    state: any;
    model_id: any;
    help: any;
}>;
