import { z } from 'zod';
import { InstanceManager } from '../services/instance-manager.js';
/**
 * Zod schemas for get_record and get_records tool inputs.
 */
export declare const GetRecordSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    res_id: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    xml_id: z.ZodOptional<z.ZodString>;
    show_meta: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_security: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_relationships: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_extended: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_computed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_related: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_lines: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_chatter: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_binary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_all_fields: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    for_user_id: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    rel_limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    with_translations: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const GetRecordsSchema: z.ZodObject<{
    model: z.ZodString;
    res_ids: z.ZodPreprocess<z.ZodDefault<z.ZodArray<z.ZodCoercedNumber<unknown>>>>;
    xml_ids: z.ZodPreprocess<z.ZodDefault<z.ZodArray<z.ZodString>>>;
    show_meta: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_security: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_relationships: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_extended: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_computed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_related: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_lines: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_chatter: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_binary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    show_all_fields: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    for_user_id: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    rel_limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    with_translations: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    instance_alias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetRecordInput = z.infer<typeof GetRecordSchema>;
export type GetRecordsInput = z.infer<typeof GetRecordsSchema>;
/**
 * Resolve single record details.
 */
export declare function getRecord(manager: InstanceManager, input: GetRecordInput): Promise<any>;
/**
 * Resolve batch records details.
 */
export declare function getRecords(manager: InstanceManager, input: GetRecordsInput): Promise<any[]>;
