import { MetadataCache } from './metadata-cache.js';
import { buildModelMetadata } from './metadata-resolver.js';
export class DomainValidationService {
    /**
     * Main entry point to validate and potentially heal an Odoo domain array.
     */
    static async validateAndHeal(client, model, domain, instanceAlias = 'default') {
        // 1. Ensure Domain is an array
        if (!Array.isArray(domain)) {
            return {
                success: false,
                errorPayload: {
                    isError: true,
                    message: `Domain Validation Error: Expected a 2D array of filters, but received type '${typeof domain}'.`,
                    diagnostic_hints: {
                        target_model: model,
                        action_directives: [
                            "Always pass the domain as an array of triplet arrays: [[field, operator, value]].",
                            "Example: [['is_company', '=', true]]"
                        ],
                        explanation: "The domain must be a valid list."
                    }
                }
            };
        }
        // 2. Validate prefix operator grammar / Polish Notation structure
        if (domain.length > 0) {
            const grammarCheck = this.checkPrefixGrammar(domain);
            if (!grammarCheck.valid) {
                return {
                    success: false,
                    errorPayload: {
                        isError: true,
                        message: `Domain Validation Error: Malformed Polish Notation operator structure. ${grammarCheck.error}`,
                        diagnostic_hints: {
                            target_model: model,
                            action_directives: [
                                "Odoo prefix operators ('&' and '|') require exactly two operands following them.",
                                "'!' takes exactly one operand.",
                                "Conditions listed without an operator are joined with AND, so [[A], [B]] needs no '&'. Only add '&' or '|' where you need them, each followed by its operands."
                            ],
                            explanation: grammarCheck.error || ''
                        }
                    }
                };
            }
        }
        // 3. Hydrate Model Schema (Metadata Cache)
        const cache = MetadataCache.getInstance();
        let metadata = cache.get(instanceAlias, model);
        if (!metadata) {
            try {
                metadata = await buildModelMetadata(client, model, instanceAlias);
                cache.set(instanceAlias, model, metadata);
            }
            catch (err) {
                return {
                    success: false,
                    errorPayload: {
                        isError: true,
                        message: `Domain Validation Error: Target model '${model}' could not be resolved or does not exist.`,
                        diagnostic_hints: {
                            target_model: model,
                            action_directives: [
                                "Verify that the model name is spelled correctly.",
                                "Execute list_models with a search_term to discover valid model names."
                            ]
                        }
                    }
                };
            }
        }
        // 4. Retrieve all valid fields from metadata.
        //    Prefer `allFields` (every field on the model). `categorized` omits the
        //    chatter/activity fields, which are still valid in a domain.
        const validFields = new Set(Object.keys(metadata.allFields || {}));
        if (metadata.categorized) {
            Object.keys(metadata.categorized.base || {}).forEach(f => validFields.add(f));
            Object.keys(metadata.categorized.extended || {}).forEach(f => validFields.add(f));
            Object.keys(metadata.categorized.computed || {}).forEach(f => validFields.add(f));
            Object.keys(metadata.categorized.related || {}).forEach(f => validFields.add(f));
            Object.keys(metadata.categorized.relational || {}).forEach(f => validFields.add(f));
            Object.keys(metadata.categorized.lines || {}).forEach(f => validFields.add(f));
        }
        validFields.add('id');
        validFields.add('create_date');
        validFields.add('write_date');
        validFields.add('create_uid');
        validFields.add('write_uid');
        // Combine all fields to make checking easy
        const allFieldDefinitions = {
            ...(metadata.allFields || {}),
            ...(metadata.categorized?.base || {}),
            ...(metadata.categorized?.extended || {}),
            ...(metadata.categorized?.computed || {}),
            ...(metadata.categorized?.related || {}),
            ...(metadata.categorized?.relational || {}),
            ...(metadata.categorized?.lines || {}),
        };
        // 5. Run Triplet-level Validation & Hybrid Healing
        const healedDomain = [];
        // Mirrors Odoo's operator sets (odoo/orm/domains.py STANDARD_CONDITION_OPERATORS
        // plus the optimised aliases). Version-specific ones such as 'any' (17+) are
        // left for Odoo itself to reject on older servers.
        const validOperators = new Set([
            '=', '!=', '<>', '==', '=?',
            '<', '>', '<=', '>=',
            'in', 'not in',
            'like', 'not like', 'ilike', 'not ilike',
            '=like', 'not =like', '=ilike', 'not =ilike',
            'child_of', 'parent_of',
            'any', 'not any',
        ]);
        for (const element of domain) {
            // If it is an operator string ('&', '|') or list item of operators
            if (typeof element === 'string') {
                const normalizedOp = element.toLowerCase();
                if (normalizedOp === 'and' || normalizedOp === '&') {
                    healedDomain.push('&');
                }
                else if (normalizedOp === 'or' || normalizedOp === '|') {
                    healedDomain.push('|');
                }
                else if (normalizedOp === 'not' || normalizedOp === '!') {
                    healedDomain.push('!');
                }
                else {
                    healedDomain.push(element);
                }
                continue;
            }
            // If it's a condition triplet [field, operator, value]
            if (Array.isArray(element)) {
                if (element.length !== 3) {
                    return {
                        success: false,
                        errorPayload: {
                            isError: true,
                            message: `Domain Validation Error: Invalid filter triplet structure. Expected exactly 3 elements: [field, operator, value], but received ${JSON.stringify(element)}.`,
                            diagnostic_hints: {
                                target_model: model,
                                action_directives: [
                                    "Ensure each filter is a flat array of exactly 3 elements, e.g., ['name', 'ilike', 'Matt']."
                                ]
                            }
                        }
                    };
                }
                const [field, operator, value] = element;
                // Check if field is valid. A dotted path ('partner_id.name') walks a
                // relation: check the first segment here and leave the rest to Odoo.
                const pathHead = typeof field === 'string' ? field.split('.')[0] : field;
                const isPath = typeof field === 'string' && field.includes('.');
                if (isPath && validFields.has(pathHead) && !allFieldDefinitions[pathHead]?.relation) {
                    return {
                        success: false,
                        errorPayload: {
                            isError: true,
                            message: `Domain Validation Error: Field '${pathHead}' on model '${model}' is not relational, so the path '${field}' cannot follow it.`,
                            diagnostic_hints: {
                                invalid_field: field,
                                target_model: model,
                                action_directives: [
                                    `Only many2one, one2many and many2many fields can be followed with '.'. Run 'inspect_model(model: "${model}")' to see which fields are relational.`
                                ],
                                explanation: `'${pathHead}' is a ${allFieldDefinitions[pathHead]?.type || 'non-relational'} field.`
                            }
                        }
                    };
                }
                if (typeof field === 'string' && !validFields.has(pathHead)) {
                    // Perform simple substring fuzzy match
                    const suggestions = Array.from(validFields).filter(vf => field.toLowerCase().includes(vf.toLowerCase()) ||
                        vf.toLowerCase().includes(field.toLowerCase()));
                    return {
                        success: false,
                        errorPayload: {
                            isError: true,
                            message: `Domain Validation Error: Field '${pathHead}' does not exist on model '${model}'.`,
                            diagnostic_hints: {
                                invalid_field: field,
                                target_model: model,
                                did_you_mean_substrings: suggestions.slice(0, 5),
                                action_directives: [
                                    `You MUST run 'inspect_model(model: "${model}")' to review the valid properties of this model.`,
                                    "Check for typings: e.g., customers/companies are commonly represented under the field 'partner_id'."
                                ],
                                explanation: `The model '${model}' does not contain any field with the name '${field}'.`
                            }
                        }
                    };
                }
                // Validate Operator
                if (!validOperators.has(operator)) {
                    return {
                        success: false,
                        errorPayload: {
                            isError: true,
                            message: `Domain Validation Error: Unsupported operator '${operator}' on field '${field}'.`,
                            diagnostic_hints: {
                                invalid_operator: operator,
                                target_model: model,
                                action_directives: [
                                    "Use a standard Odoo operator: '=', '!=', '=?', '<', '>', '<=', '>=', 'in', 'not in', 'like', 'not like', 'ilike', 'not ilike', '=like', '=ilike', 'child_of', 'parent_of', 'any', 'not any'."
                                ],
                                explanation: `Odoo's query engine does not recognize the operator '${operator}'. To search for substrings, use 'ilike'.`
                            }
                        }
                    };
                }
                // Hybrid Healing: Cast String "true"/"false" to Boolean
                let healedValue = value;
                const fieldDef = allFieldDefinitions[field];
                if (fieldDef && fieldDef.type === 'boolean' && typeof value === 'string') {
                    const valLower = value.toLowerCase();
                    if (valLower === 'true' || valLower === '1') {
                        healedValue = true;
                    }
                    else if (valLower === 'false' || valLower === '0') {
                        healedValue = false;
                    }
                }
                healedDomain.push([field, operator, healedValue]);
            }
            else {
                healedDomain.push(element);
            }
        }
        return {
            success: true,
            healedDomain
        };
    }
    /**
     * Arity/grammar check on prefix domains, following Odoo's normalize_domain
     * (odoo/osv/expression.py): when a complete expression is followed by more
     * terms, Odoo inserts an implicit '&'. So [A, B] is valid (= ['&', A, B]);
     * only operators left without enough operands are an error.
     */
    static checkPrefixGrammar(domain) {
        let expected = 1;
        for (const item of domain) {
            if (expected === 0) {
                // More terms after a complete expression: implicit '&', as Odoo does.
                expected = 1;
            }
            if (typeof item === 'string') {
                const op = item.toLowerCase();
                if (op === '&' || op === '|' || op === 'and' || op === 'or') {
                    expected += 1;
                }
                else if (op === '!' || op === 'not') {
                    // Net +0
                }
                else {
                    return { valid: false, error: `Invalid string operator found in domain: '${item}'. Only '&', '|', and '!' are supported.` };
                }
            }
            else if (Array.isArray(item)) {
                expected -= 1;
            }
            else {
                return { valid: false, error: `Invalid item format inside domain array: ${JSON.stringify(item)}` };
            }
        }
        if (expected !== 0) {
            return { valid: false, error: `Unbalanced operators. Expected ${expected} more conditions to satisfy the prefix logical operators.` };
        }
        return { valid: true };
    }
}
//# sourceMappingURL=domain-validator.js.map