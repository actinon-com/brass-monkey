---
name: odoo-introspector
description: MANDATORY for technical discovery. Expertise in Odoo's internal ORM structures, field types, and metadata interpretation.
---
# Skill: Odoo Introspector

This skill provides the Gemini agent with the necessary expertise to examine, understand, and interpret Odoo's internal ORM (Object-Relational Mapping) structures and metadata.

## Core Mandates

### 1. Static Resources vs. Live Truth
- **Mandate:** All static resources (e.g., `core-models.md`, `*-fields.json`) provided in skills are **convenience snapshots** of standard Odoo models. They are NOT exhaustive and do NOT include custom fields added via Odoo Studio or third-party modules.
- **Verification:** If a user mentions a field that is not in your resources, or if a task requires absolute technical precision, you **MUST** call `inspect_model` to retrieve the "Live Truth" from the target Odoo instance. NEVER argue with a user about a field's existence based on a static resource.

### 2. Baseline Field Assumptions
When inspecting an Odoo model (via `inspect_model`), you must assume the following baseline for every field unless a property flag explicitly overrides it:
- **Storage:** The field is stored in the database (`store: true`).
- **Mutability:** The field is both readable and writable (`readonly: false`).
- **Optionality:** The field is optional (`required: false`).
- **Scope:** The field is shared across all companies in the instance (`company_dependent: false`).
- **Translation:** The field is NOT translatable (`translate: false`).

### 2. Interpreting Lean Property Encoding
The `inspect_model` tool uses a compressed "Lean Property Encoding" strategy. Deviations from the baseline assumptions are listed in a `properties` array:
- `required`: The field MUST be provided during creation.
- `readonly`: The field is managed by the system and cannot be manually written.
- `company-dependent`: The field value is stored per-company (via `ir.property`).
- `not-stored`: The field is computed on-the-fly and cannot be used in direct SQL-like searches unless it is explicitly marked as stored.
- `translatable`: The field supports multiple languages. The server handles language synchronization for you.

### 3. Orchestrated Field Metadata
Beyond basic properties, `inspect_model` provides middleware-driven enhancements:
- **Search Hints (`hint`)**: Relational fields (Many2one) often include a `hint` property containing the Odoo domain. Use this to construct your `search_read` filters for that model.
- **Label Expansion**: Relational fields are automatically expanded by the server where possible, providing both the ID and the display name.

## Model Discovery Workflow
1. **Search:** Use `list_models` with a `search_term` to find the technical name (e.g., `sale.order`) of the business object you need.
2. **Inspect:** Use `inspect_model` to understand the fields, their types, and their relationships.
    - **Proactive Discovery:** Use flags like `show_methods: true` to find Server Actions and View Buttons, or `show_ui: true` to find the XML IDs of associated forms and lists.
3. **Trace:** Use `trace_ui_path` to map a technical model back to the user's visual interface (Menu -> Action -> View). This is essential for answering "How does a user manage this data?".
4. **Reference:** Consult the `odoo-field-types` resource for deep-dives into complex relations. Use `search_records` for breadth searches and `get_record` for 360-degree deep-dives.

*Note: All introspection tools support the `instance_alias` parameter if you need to explore a non-default environment.*

## Available Resources
- `odoo-field-types.md`: Technical guide for Many2one, One2many, Many2many, and Compute fields.
- `core-models.md`: Optimized schemas for ubiquitous models (e.g., `res.partner`).
