import { z } from 'zod';
import { ModelMetadata } from './metadata-cache.js';
/**
 * Shared `with_company` parameter. Named after Odoo's `with_company()`: the
 * call acts for that company. It matters for company-dependent fields, which
 * Odoo stores once per company and reads and writes for the active company only.
 */
export declare const withCompanyParam: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
/** Returns `client` acting for `companyId`, or unchanged when none is given. */
export declare function scopeClient<T>(client: T, companyId?: number): Promise<T>;
/** The company-dependent fields among `fieldNames`, per the model's metadata. */
export declare function companyDependentFields(metadata: ModelMetadata, fieldNames: string[]): string[];
/**
 * A note naming the company that company-dependent fields were read or written
 * for. Undefined when there is nothing to say: no such fields, or the user has
 * only one company.
 */
export declare function companyDependentNote(client: any, metadata: ModelMetadata, fieldNames: string[], action: 'read' | 'written'): Promise<{
    fields: string[];
    company: {
        id: number;
        name: string;
    };
    note: string;
} | undefined>;
