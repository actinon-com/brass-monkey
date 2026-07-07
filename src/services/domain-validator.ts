import { MetadataCache } from './metadata-cache.js';
import { buildModelMetadata } from './metadata-resolver.js';

export interface ValidationResult {
  success: boolean;
  healedDomain?: any[];
  errorPayload?: {
    isError: boolean;
    message: string;
    diagnostic_hints: {
      invalid_field?: string;
      invalid_operator?: string;
      target_model: string;
      did_you_mean_substrings?: string[];
      action_directives: string[];
      explanation?: string;
    };
  };
}

export class DomainValidationService {
  /**
   * Main entry point to validate and potentially heal an Odoo domain array.
   */
  public static async validateAndHeal(
    client: any,
    model: string,
    domain: any[],
    instanceAlias: string = 'default'
  ): Promise<ValidationResult> {
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
                "If you have only one condition, do not include any operators. Just pass the single condition, e.g. [['is_company', '=', true]]."
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
      } catch (err: any) {
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

    // 4. Retrieve all valid fields from metadata
    const validFields = new Set<string>();
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
    const allFieldDefinitions: Record<string, any> = {
      ...(metadata.categorized?.base || {}),
      ...(metadata.categorized?.extended || {}),
      ...(metadata.categorized?.computed || {}),
      ...(metadata.categorized?.related || {}),
      ...(metadata.categorized?.relational || {}),
      ...(metadata.categorized?.lines || {}),
    };

    // 5. Run Triplet-level Validation & Hybrid Healing
    const healedDomain: any[] = [];
    const validOperators = new Set(['=', '!=', 'like', 'ilike', '=like', '=ilike', 'in', 'not in', 'child_of', '<', '>', '<=', '>=']);

    for (const element of domain) {
      // If it is an operator string ('&', '|') or list item of operators
      if (typeof element === 'string') {
        const normalizedOp = element.toLowerCase();
        if (normalizedOp === 'and' || normalizedOp === '&') {
          healedDomain.push('&');
        } else if (normalizedOp === 'or' || normalizedOp === '|') {
          healedDomain.push('|');
        } else if (normalizedOp === 'not' || normalizedOp === '!') {
          healedDomain.push('!');
        } else {
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

        // Check if field is valid
        if (typeof field === 'string' && !validFields.has(field)) {
          // Perform simple substring fuzzy match
          const suggestions = Array.from(validFields).filter(vf => 
            field.toLowerCase().includes(vf.toLowerCase()) || 
            vf.toLowerCase().includes(field.toLowerCase())
          );

          return {
            success: false,
            errorPayload: {
              isError: true,
              message: `Domain Validation Error: Field '${field}' does not exist on model '${model}'.`,
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
                  "Use only standard Odoo operators: '=', '!=', 'like', 'ilike', 'in', 'not in', '<', '>', '<=', '>=', 'child_of'."
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
          } else if (valLower === 'false' || valLower === '0') {
            healedValue = false;
          }
        }

        healedDomain.push([field, operator, healedValue]);
      } else {
        healedDomain.push(element);
      }
    }

    return {
      success: true,
      healedDomain
    };
  }

  /**
   * Helper to perform arity/grammar checks on prefix domains.
   */
  private static checkPrefixGrammar(domain: any[]): { valid: boolean; error?: string } {
    let expected = 1;
    for (const item of domain) {
      if (typeof item === 'string') {
        const op = item.toLowerCase();
        if (op === '&' || op === '|' || op === 'and' || op === 'or') {
          expected += 1;
        } else if (op === '!' || op === 'not') {
          // Net +0
        } else {
          return { valid: false, error: `Invalid string operator found in domain: '${item}'. Only '&', '|', and '!' are supported.` };
        }
      } else if (Array.isArray(item)) {
        expected -= 1;
      } else {
        return { valid: false, error: `Invalid item format inside domain array: ${JSON.stringify(item)}` };
      }

      if (expected < 0) {
        return { valid: false, error: "Too many conditions found for the prefix operators supplied." };
      }
    }

    if (expected !== 0) {
      return { valid: false, error: `Unbalanced operators. Expected ${expected} more conditions to satisfy the prefix logical operators.` };
    }

    return { valid: true };
  }
}
