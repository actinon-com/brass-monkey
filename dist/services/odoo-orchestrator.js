/**
 * Orchestrator service to handle complex Odoo business logic server-side.
 * Replicates the "Forgiving Format" and "Middleware Manager" philosophy of brass-compass.
 */
export class OdooOrchestrator {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Fetches all translations for a set of records and fields,
     * returning them in the 'Forgiving' format.
     */
    async fetchTranslationMatrix(model, resIds, fieldNames) {
        if (!fieldNames.length || !resIds.length)
            return {};
        try {
            const langs = await this.client.executeKw('res.lang', 'search_read', [[['active', '=', true]]], { fields: ['code'] });
            const langCodes = langs.map((l) => l.code);
            // Matrix: { res_id: { field_name: { lang_code: value } } }
            const matrix = {};
            for (const rid of resIds) {
                matrix[rid] = {};
                for (const fname of fieldNames) {
                    matrix[rid][fname] = {};
                }
            }
            // Batch fetch per language
            for (const lang of langCodes) {
                const langData = await this.client.executeKw(model, 'read', [resIds], { fields: fieldNames, context: { lang } });
                for (const rec of langData) {
                    const rid = rec.id;
                    for (const fname of fieldNames) {
                        matrix[rid][fname][lang] = rec[fname];
                    }
                }
            }
            // Simplify Phase into "Forgiving Format"
            const results = {};
            for (const rid of resIds) {
                results[rid] = {};
                for (const fname of fieldNames) {
                    const values = matrix[rid][fname];
                    const uniqueValues = {};
                    for (const [lang, val] of Object.entries(values)) {
                        const key = JSON.stringify(val);
                        if (!uniqueValues[key])
                            uniqueValues[key] = [];
                        uniqueValues[key].push(lang);
                    }
                    const entries = Object.entries(uniqueValues);
                    if (entries.length <= 1) {
                        // All identical (Clean case)
                        results[rid][fname] = entries.length > 0 ? JSON.parse(entries[0][0]) : false;
                    }
                    else {
                        // Divergent (Expanded case)
                        // Sort by popularity to find the most common as "fallback"
                        entries.sort((a, b) => b[1].length - a[1].length);
                        results[rid][fname] = entries.map(([valJson, lList], index) => ({
                            value: JSON.parse(valJson),
                            langs: index === 0 ? [] : lList // First one is the fallback
                        }));
                    }
                }
            }
            return results;
        }
        catch (e) {
            console.error(`Translation matrix fetch failed: ${e}`);
            return {};
        }
    }
    /**
     * Processes input values for a write/create operation, handling translatable fields.
     * Performs "Broadcast Writing" to keep languages in sync.
     */
    async applyBroadcastWrite(model, resId, values, transFields) {
        const mainWrite = {};
        const translationWrites = {};
        const langs = await this.client.executeKw('res.lang', 'search_read', [[['active', '=', true]]], { fields: ['code'] });
        const langCodes = langs.map((l) => l.code);
        for (const lcode of langCodes)
            translationWrites[lcode] = {};
        for (const [fname, val] of Object.entries(values)) {
            if (transFields.includes(fname)) {
                if (Array.isArray(val)) {
                    // Expanded format: [{"value": "...", "langs": []}, ...]
                    for (const bucket of val) {
                        const targetLangs = bucket.langs || [];
                        if (targetLangs.length === 0) {
                            // Fallback case
                            mainWrite[fname] = bucket.value;
                            for (const lcode of langCodes)
                                translationWrites[lcode][fname] = bucket.value;
                        }
                        else {
                            for (const lcode of targetLangs) {
                                if (translationWrites[lcode])
                                    translationWrites[lcode][fname] = bucket.value;
                            }
                        }
                    }
                }
                else {
                    // Simple string format: Sync to all
                    mainWrite[fname] = val;
                    for (const lcode of langCodes)
                        translationWrites[lcode][fname] = val;
                }
            }
            else {
                mainWrite[fname] = val;
            }
        }
        // Execution
        let resultId = resId;
        if (resId === null) {
            // Create
            resultId = await this.client.executeKw(model, 'create', [mainWrite]);
        }
        else {
            // Write
            await this.client.executeKw(model, 'write', [[resId], mainWrite]);
        }
        // Apply translations
        for (const [lcode, vals] of Object.entries(translationWrites)) {
            if (Object.keys(vals).length > 0) {
                await this.client.executeKw(model, 'write', [[resultId], vals], { context: { lang: lcode } });
            }
        }
        return resultId;
    }
    /**
     * Enhances records with label expansions for Many2one fields.
     */
    async enrichRelationalLabels(model, records) {
        // Odoo search_read already returns [id, "name"] for Many2one.
        // This method ensures they are consistently formatted if needed.
        return records;
    }
    /**
     * Intelligent resolution of field values.
     * 1. Resolves strings to IDs for Many2one fields via name_search.
     * 2. Converts lists of objects to (0, 0, {values}) commands for One2many/Many2many.
     */
    async resolveFieldValues(model, values) {
        const fRecords = await this.client.executeKw('ir.model.fields', 'search_read', [[['model_id.model', '=', model]]], {
            fields: ['name', 'ttype', 'relation']
        });
        const fieldMap = fRecords.reduce((acc, f) => {
            acc[f.name] = f;
            return acc;
        }, {});
        const resolvedValues = { ...values };
        for (const [fname, val] of Object.entries(values)) {
            const field = fieldMap[fname];
            if (!field)
                continue;
            // 1. Many2one Name Resolution
            if (field.ttype === 'many2one' && typeof val === 'string') {
                const matches = await this.client.executeKw(field.relation, 'name_search', [], { name: val, limit: 2 });
                if (matches.length === 1) {
                    resolvedValues[fname] = matches[0][0]; // Extract ID
                }
                else if (matches.length > 1) {
                    const options = matches.map((m) => `${m[1]} (ID: ${m[0]})`).join(', ');
                    throw new Error(`Ambiguous resolution for '${val}' on ${fname}. Found multiple matches: ${options}. Please provide a specific ID.`);
                }
                else {
                    throw new Error(`Could not resolve '${val}' to a valid ${field.relation} ID for field ${fname}.`);
                }
            }
            // 2. X2many Command-Tuple Shorthand
            if (['one2many', 'many2many'].includes(field.ttype) && Array.isArray(val)) {
                const commands = val.map(item => {
                    if (typeof item === 'object' && !Array.isArray(item)) {
                        // Auto-convert object to (0, 0, {values})
                        return [0, 0, item];
                    }
                    if (typeof item === 'number') {
                        // Auto-convert ID to (4, id)
                        return [4, item, 0];
                    }
                    return item; // Assume it's already a command tuple
                });
                resolvedValues[fname] = commands;
            }
        }
        return resolvedValues;
    }
}
//# sourceMappingURL=odoo-orchestrator.js.map