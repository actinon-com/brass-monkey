import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for download_file tool input.
 */
export declare const DownloadFileSchema: z.ZodObject<{
    model: z.ZodDefault<z.ZodString>;
    res_id: z.ZodCoercedNumber<unknown>;
    field: z.ZodDefault<z.ZodString>;
    destination_path: z.ZodString;
    justification: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DownloadFileInput = z.infer<typeof DownloadFileSchema>;
/**
 * Tool to download any file or attachment from an Odoo database to the local workspace.
 * @param manager The InstanceManager instance.
 * @param input The DownloadFileInput parameters.
 * @returns The absolute path to the saved file.
 */
export declare function downloadFile(manager: InstanceManager, input: DownloadFileInput): Promise<string>;
