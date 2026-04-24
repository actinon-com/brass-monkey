# Skill: Odoo Introspector

This skill provides the Gemini agent with the necessary expertise to examine, understand, and interpret Odoo's internal ORM (Object-Relational Mapping) structures and metadata.

## Core Mandates

### 1. Baseline Field Assumptions
When inspecting an Odoo model (via `inspect_model`), you must assume the following baseline for every field unless a property flag explicitly overrides it:
- **Storage:** The field is stored in the database (`store: true`).
- **Mutability:** The field is both readable and writable (`readonly: false`).
- **Optionality:** The field is optional (`required: false`).
- **Scope:** The field is shared across all companies in the instance (`company_dependent: false`).

### 2. Interpreting Lean Property Encoding
The `inspect_model` tool uses a compressed "Lean Property Encoding" strategy. Deviations from the baseline assumptions are listed in a `properties` array:
- `required`: The field MUST be provided during creation.
- `readonly`: The field is managed by the system and cannot be manually written.
- `company-dependent`: The field value is stored per-company (via `ir.property`).
- `not-stored`: The field is computed on-the-fly and cannot be used in direct SQL-like searches unless it is explicitly marked as stored.

### 3. Model Discovery Workflow
1. **Search:** Use `list_models` with a `search_term` to find the technical name (e.g., `sale.order`) of the business object you need.
2. **Inspect:** Use `inspect_model` to understand the fields, their types, and their relationships.
3. **Reference:** Consult the `odoo-field-types` resource for deep-dives into complex relations like `one2many` or `compute` fields.

*Note: All introspection tools support the `instance_alias` parameter if you need to explore a non-default environment.*

## Available Resources
- `odoo-field-types.md`: Technical guide for Many2one, One2many, Many2many, and Compute fields.
- `core-models.md`: Optimized schemas for ubiquitous models (e.g., `res.partner`).
