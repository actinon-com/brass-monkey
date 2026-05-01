import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_action tool input.
 * Includes pre-processing to handle numeric strings.
 */
export declare const GetActionSchema: z.ZodObject<{
    action_id: z.ZodCoercedNumber<unknown>;
    action_type: z.ZodDefault<z.ZodString>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetActionInput = z.infer<typeof GetActionSchema>;
/**
 * Tool to retrieve Odoo action details (e.g., act_window).
 * @param manager The InstanceManager instance.
 * @param input The GetActionInput parameters.
 * @returns Details of the Odoo action, including target model and views.
 */
export declare function getAction(manager: InstanceManager, input: GetActionInput): Promise<{
    id: number;
    name: any;
    res_model: any;
    view_mode: any;
    view_id: any;
    domain: any;
    context: any;
    target: any;
    help: any;
}>;
