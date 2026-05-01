import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for inspect_model tool input.
 * Full parity with original brass-compass flags for deep introspection.
 */
export declare const InspectModelSchema: z.ZodObject<{
    model: z.ZodString;
    show_base: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_extended: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_computed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_related: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_lines: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_relationships: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_stats: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_access: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_modules: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_ui: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_methods: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InspectModelInput = z.infer<typeof InspectModelSchema>;
/**
 * Tool to perform a deep architectural audit of an Odoo model's definition.
 * Dynamically categorizes fields and discovers execution/UI entry points.
 */
export declare function inspectModel(manager: InstanceManager, input: InspectModelInput): Promise<any>;
