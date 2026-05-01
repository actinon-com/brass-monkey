import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for download_report tool input.
 * Includes pre-processing to handle numeric strings and single-item arrays.
 */
export declare const DownloadReportSchema: z.ZodObject<{
    report_id: z.ZodCoercedNumber<unknown>;
    record_ids: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodArray<z.ZodNumber>>;
    destination_path: z.ZodString;
    justification: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DownloadReportInput = z.infer<typeof DownloadReportSchema>;
/**
 * Tool to render and download an Odoo report to the local workspace.
 * @param manager The InstanceManager instance.
 * @param input The DownloadReportInput parameters.
 * @returns The absolute path to the saved report.
 */
export declare function downloadReport(manager: InstanceManager, input: DownloadReportInput): Promise<string>;
