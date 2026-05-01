import { z } from 'zod';
/**
 * Zod schema for validating Odoo connection credentials.
 */
export const OdooConfigSchema = z.object({
    url: z.string().url().describe('Odoo instance URL (e.g., https://my-odoo.odoo.com)'),
    db: z.string().min(1).describe('Database name'),
    username: z.string().min(1).describe('Username/Email'),
    api_key: z.string().min(1).optional().describe('Odoo External API Key (recommended) or user password'),
    write_guard: z.boolean().optional().describe('Prevent accidental writes to live instances'),
});
/**
 * Schema for standard Odoo XML-RPC error responses (informational).
 */
export const OdooErrorSchema = z.object({
    faultCode: z.number(),
    faultString: z.string(),
});
//# sourceMappingURL=odoo-config.schema.js.map