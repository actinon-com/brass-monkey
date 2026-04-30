import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_view tool input.
 * Includes pre-processing to handle numeric strings.
 */
export declare const GetViewSchema: z.ZodObject<{
    model: z.ZodString;
    view_type: z.ZodEnum<{
        search: "search";
        form: "form";
        tree: "tree";
        kanban: "kanban";
        calendar: "calendar";
        pivot: "pivot";
        graph: "graph";
    }>;
    view_id: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetViewInput = z.infer<typeof GetViewSchema>;
/**
 * Tool to retrieve Odoo view architecture.
 * @param manager The InstanceManager instance.
 * @param input The GetViewInput parameters.
 * @returns The view architecture (XML) and metadata.
 */
export declare function getView(manager: InstanceManager, input: GetViewInput): Promise<{
    model: string;
    view_type: "search" | "form" | "tree" | "kanban" | "calendar" | "pivot" | "graph";
    view_id: any;
    arch: any;
    fields: any;
}>;
