import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for trace_ui_path tool input.
 */
export declare const TraceUiPathSchema: z.ZodObject<{
    model: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TraceUiPathInput = z.infer<typeof TraceUiPathSchema>;
/**
 * Tool to trace the UI path (Menus -> Actions -> Views) for a technical model.
 * Helps the agent understand how a user visually accesses specific data.
 */
export declare function traceUiPath(manager: InstanceManager, input: TraceUiPathInput): Promise<string | {
    summary: string;
    paths: {
        menu_path: any;
        action_name: any;
        action_xmlid: any;
        view_mode: any;
        context: any;
        domain: any;
    }[];
}>;
