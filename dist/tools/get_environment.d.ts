import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
import { SkillGuard } from '../services/skill-guard.js';
/**
 * Zod schema for get_environment tool input.
 */
export declare const GetEnvironmentSchema: z.ZodObject<{
    show_security: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_manifest: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetEnvironmentInput = z.infer<typeof GetEnvironmentSchema>;
/**
 * Dense Tool: Get a global 'World Map' of the current Odoo environment.
 * Provides server, user, and organization context in one call.
 */
export declare function getEnvironment(manager: InstanceManager, guard: SkillGuard, input: GetEnvironmentInput): Promise<{
    summary: string;
    environment: any;
}>;
