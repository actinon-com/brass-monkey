---
name: odoo-data-ops
description: Expertise required to safely query and modify Odoo business data while maintaining a rigorous audit trail and reversibility context.
---
# Skill: Odoo Data Operations (CRUD)

This skill provides the Gemini agent with the expertise required to safely query and modify Odoo business data while maintaining a rigorous audit trail and reversibility context.

## Core Mandates

### 1. Odoo Domain Syntax (Prefix-based)
Odoo uses a prefix-based polish notation for domain filters. You must follow this syntax when using `search_read`:
- **AND (`&`):** Default behavior. `['&', (A), (B)]` means A and B.
- **OR (`|`):** `['|', (A), (B)]` means A or B.
- **NOT (`!`):** `['!', (A)]` means not A.
- **Example:** `['&', ('is_company', '=', True), '|', ('city', '=', 'New York'), ('city', '=', 'London')]`

### 2. Mandatory Justification
All state-changing operations (`create_record`, `write_record`, `unlink_record`) require a `justification` parameter. 
- **Requirement:** This must be a clear, business-focused reason for the change.
- **Persistence:** This reason is permanently recorded in Odoo's Chatter (`mail.message`) and `ir.logging`.

### 3. Instance Awareness
Every CRUD tool supports an `instance_alias` parameter.
- **Default:** If omitted, the tool uses the current session's default instance.
- **Cross-Instance:** You can read from one environment and write to another by explicitly specifying different aliases in separate tool calls.

### 4. Efficient Data Retrieval
- **Field Categorization:** By default, `search_read` only returns "Base" fields to save context. If you need more, use `include_extended: true` (for extra modules) or `include_computed: true` (for calculated fields).
- **Aggregations:** Use `aggregate_records` for BI-style queries (grouping, counting, summing). This is much more context-efficient than reading thousands of records to perform local math.

### 5. Schema Strictness & Error Recovery
Odoo v18+ is strict about field lists in `search_read`. 
- **The Trigger:** If you receive a `ValueError` or `KeyError` stating a field does not exist.
- **The Mandate:** You must STOP and call `inspect_model` to verify the current live schema. Do NOT guess field names.
- **Action:** After finding the correct field, retry the operation with the updated field list.

### 6. Agent-Driven Undo Workflow
If you make a mistake or are asked to "undo" a change:
1. **Locate:** Use `search_read` on the `mail.message` model for the target record to find the "Before Snapshot" you previously posted.
2. **Analyze:** Verify the current record state. Do not attempt a rollback if it violates Odoo's business logic (e.g., trying to revert an invoice that has since been paid).
3. **Revert:** Use `write_record` to re-apply the old values from the snapshot, providing a justification like `"Reverting previous AI action: [Original Reason]"`.

### 7. Handling Relational Fields
- **Many2one:** Pass the integer ID of the target record.
- **X2many (One2many/Many2many):** Use command tuples:
    - `(0, 0, {values})`: Create a new linked record.
    - `(4, id)`: Link an existing record.
    - `(3, id)`: Unlink (but don't delete) a record.
    - `(2, id)`: Unlink and delete a record.
    - `(6, 0, [ids])`: Replace all existing links with this list of IDs.

### 8. Multi-Company Logic (Golden Rule)
Odoo is a multi-company environment. By default, Brass-Monkey enables cross-company visibility, but you must be precise:
- **Visibility:** You can see records from all allowed companies (retrieved during `get_environment`).
- **Filtering:** To query data for a specific company, ALWAYS include `['company_id', '=', ID]` in your domain.
- **Operational Safety:** NEVER attempt to modify your own `res.users` record to change your active company. This is considered **System Vandalism**. 
- **Correct Pattern:** If you need to "switch" companies for a query, simply use the `company_id` domain filter.

### 9. Orchestrated Translations (Forgiving Format)
Odoo supports multi-language fields (marked as `translatable` in `inspect_model`). Brass-Monkey handles the complexity of these fields for you:
- **Enabling Matrix:** Set `with_translations: true` in `search_read` to see all translations.
- **The Matrix Format:** Translatable fields will return an array of objects if values diverge: `[{"value": "My Product", "langs": []}, {"value": "Mon Produit", "langs": ["fr_FR"]}]`.
- **Broadcast Writing:** If you provide a simple string to a translatable field (e.g., `"name": "New Name"`), the server automatically syncs it across ALL active languages.
- **Targeted Writing:** You can provide the expanded array format to `write_record` to update specific languages.

### 10. System Vandalism Warning
You are an AI agent with high-level access. You must NEVER:
- Modify your own user record's `company_id`, `company_ids`, or `groups_id`.
- Delete system-critical records to "clean up" your view.
- Bypass Odoo's business logic by directly modifying internal state fields (e.g., `state`, `move_id`) if a specialized method is available.
- **Enforcement:** Attempting these actions will trigger tool-level safety blocks and may result in session termination.
