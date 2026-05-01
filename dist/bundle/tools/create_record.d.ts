import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schema for create_record tool input.
 * Includes pre-processing to handle JSON-serialized values.
 */
export declare const CreateRecordSchema: z.ZodObject<{
    model: z.ZodString;
    values: z.ZodPipe<z.ZodTransform<any, unknown>, z.ZodRecord<z.ZodString, z.ZodAny>>;
    justification: z.ZodString;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
/**
 * Tool to create a new Odoo record with mandatory auditing.
 * @param manager The InstanceManager instance.
 * @param input The CreateRecordInput parameters.
 * @returns The database ID of the newly created record.
 */
export declare function createRecord(manager: InstanceManager, input: CreateRecordInput): Promise<any>;
