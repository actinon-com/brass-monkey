import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for write_record tool input.
 * Includes pre-processing to handle numeric strings and JSON-serialized values.
 */
export declare const WriteRecordSchema: z.ZodObject<{
    model: z.ZodString;
    id: z.ZodCoercedNumber<unknown>;
    values: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodRecord<z.ZodString, z.ZodAny>>;
    justification: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type WriteRecordInput = z.infer<typeof WriteRecordSchema>;
/**
 * Tool to update an existing Odoo record with snapshot-based reversibility.
 * @param manager The InstanceManager instance.
 * @param input The WriteRecordInput parameters.
 * @returns Boolean true on success.
 */
export declare function writeRecord(manager: InstanceManager, input: WriteRecordInput): Promise<any>;
