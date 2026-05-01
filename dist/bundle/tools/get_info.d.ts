import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for get_info tool input.
 */
export declare const GetInfoSchema: z.ZodObject<{}, z.core.$strip>;
/**
 * Tool to get version and environment information for the Brass-Monkey extension.
 * @param manager The InstanceManager instance.
 * @returns An object containing version, instance, and system metadata.
 */
export declare function getInfo(manager: InstanceManager): Promise<{
    extension: {
        name: string;
        version: string;
        status: string;
    };
    context: {
        active_instance: any;
        odoo_version: string;
        configured_instances: number;
    };
    environment: {
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
        node_version: string;
        os_release: string;
    };
}>;
