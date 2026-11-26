import { z } from 'zod';
/**
 * Shared `with_company` parameter. Named after Odoo's `with_company()`: the
 * call acts for that company. It matters for company-dependent fields, which
 * Odoo stores once per company and reads and writes for the active company only.
 */
export const withCompanyParam = z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .describe("Company ID to act for, like Odoo's with_company(). It goes first in allowed_company_ids (Odoo's active company); your other companies stay visible. Set it when reading or writing company-dependent fields (one value per company, e.g. property accounts, product project templates). Without it, the first of your companies is used.");
/** Returns `client` acting for `companyId`, or unchanged when none is given. */
export async function scopeClient(client, companyId) {
    if (companyId === undefined)
        return client;
    return client.withCompany(companyId);
}
/** The company-dependent fields among `fieldNames`, per the model's metadata. */
export function companyDependentFields(metadata, fieldNames) {
    const flagged = new Set();
    for (const [name, def] of Object.entries(metadata.allFields || {})) {
        if (def.companyDependent)
            flagged.add(name);
    }
    for (const bucket of Object.values(metadata.categorized || {})) {
        for (const [name, def] of Object.entries(bucket || {})) {
            if (def?.properties?.includes('company-dependent'))
                flagged.add(name);
        }
    }
    return fieldNames.filter(f => flagged.has(f));
}
/**
 * A note naming the company that company-dependent fields were read or written
 * for. Undefined when there is nothing to say: no such fields, or the user has
 * only one company.
 */
export async function companyDependentNote(client, metadata, fieldNames, action) {
    if (!client?.isMultiCompany)
        return undefined;
    const fields = companyDependentFields(metadata, fieldNames);
    if (fields.length === 0)
        return undefined;
    const id = client.activeCompany;
    if (id === null || id === undefined)
        return undefined;
    const name = await client.companyName(id);
    const verb = action === 'read' ? 'read' : 'write';
    return {
        fields,
        company: { id, name },
        note: `These fields hold a separate value for each company. They were ${action} for ${name} (${id}) only. To ${verb} them for another company, repeat the call with with_company set to that company's ID.`,
    };
}
//# sourceMappingURL=company-scope.js.map