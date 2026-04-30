import { z } from 'zod';
/**
 * Zod schema for validating Odoo connection credentials.
 */
export declare const OdooConfigSchema: z.ZodObject<{
    url: z.ZodString;
    db: z.ZodString;
    username: z.ZodString;
    api_key: z.ZodString;
}, z.core.$strip>;
/**
 * TypeScript type inferred from the OdooConfigSchema.
 */
export type OdooConfig = z.infer<typeof OdooConfigSchema>;
/**
 * Schema for standard Odoo XML-RPC error responses (informational).
 */
export declare const OdooErrorSchema: z.ZodObject<{
    faultCode: z.ZodNumber;
    faultString: z.ZodString;
}, z.core.$strip>;
export type OdooError = z.infer<typeof OdooErrorSchema>;
