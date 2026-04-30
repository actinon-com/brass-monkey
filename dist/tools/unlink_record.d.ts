import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for unlink_record tool input.
 * Includes pre-processing to handle numeric strings.
 */
export declare const UnlinkRecordSchema: z.ZodObject<{
    model: z.ZodString;
    id: z.ZodCoercedNumber<unknown>;
    justification: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UnlinkRecordInput = z.infer<typeof UnlinkRecordSchema>;
/**
 * Tool to delete (unlink) an Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The UnlinkRecordInput parameters.
 * @returns Boolean true on success.
 */
export declare function unlinkRecord(manager: InstanceManager, input: UnlinkRecordInput): Promise<any>;
