---
name: odoo-data-ops
description: Expertise required to safely query and modify Odoo business data while maintaining a rigorous audit trail and reversibility context.
---
# Skill: Odoo Data Operations (CRUD)

This skill provides the Gemini agent with the expertise required to safely query and modify Odoo business data while maintaining a rigorous audit trail and reversibility context.

## Core Mandates

### 1. The "Breadth vs. Depth" Search Paradigm (Golden Rule)
To prevent massive token-context inflation and optimize database execution, you must strictly follow this two-step data retrieval flow:
1.  **Breadth (`search_records`):** ALWAYS use `search_records` first to discover data and locate specific IDs. 
    - **Safe Defaults:** Leave `fields` blank/empty to fetch our optimized, low-token "Breadth Layout" (ID, Display Name, State, Freshness, and the hierarchical "Belonging Relation"). 
    - **Exclusions:** This tool strictly excludes heavy relational arrays or child lines to keep the response microscopic and scanable.
    - **Pagination:** It returns a metadata envelope (`total_count`, `leads` map of ID to display names) to assist your pagination.
2.  **Depth (`get_record` / `get_records`):** Once you find a target ID, use `get_record` to fetch its 360-degree detailed "Record Dashboard".
    - Turn on flags like **`show_lines`** (resolves full child rows for line tables, e.g., sales lines) and **`show_chatter`** (fetches the last 5 Odoo Chatter comments) to get a complete picture in a single turn.

### 2. Odoo Domain Syntax (Prefix-based)
Odoo uses a prefix-based polish notation for domain filters. You must follow this syntax when using `search_records`:
- **AND (`&`):** Default behavior. `['&', (A), (B)]` means A and B.
- **OR (`|`):** `['|', (A), (B)]` means A or B.
- **NOT (`!`):** `['!', (A)]` means not A.
- **Example:** `['&', ('is_company', '=', True), '|', ('city', '=', 'New York'), ('city', '=', 'London')]`

### 3. Mandatory Justification
All state-changing operations (`create_record`, `write_record`, `unlink_record`) require a `justification` parameter. 
- **Requirement:** This must be a clear, business-focused reason for the change.
- **Persistence:** This reason is permanently recorded in Odoo's Chatter (`mail.message`) and `ir.logging`.

### 4. Instance Awareness
Every CRUD tool supports an `instance_alias` parameter.
- **Default:** If omitted, the tool uses the current session's default instance.
- **Cross-Instance:** You can read from one environment and write to another by explicitly specifying different aliases in separate tool calls.

### 5. Efficient Data Retrieval
- **Fields Overrides:** If you need specific extra fields in `search_records`, pass them explicitly in the `fields` array.
- **Aggregations:** Use `aggregate_records` for BI-style queries (grouping, counting, summing). This is much more context-efficient than reading thousands of records to perform local math.

### 6. Schema Strictness & Error Recovery
Odoo v18+ is strict about field lists. 
- **The Trigger:** If you receive a `ValueError` or `KeyError` stating a field does not exist.
- **The Mandate:** You must STOP and call `inspect_model` to verify the current live schema. Do NOT guess field names.
- **Action:** After finding the correct field, retry the operation with the updated field list.

### 7. Agent-Driven Undo Workflow
If you make a mistake or are asked to "undo" a change:
1. **Locate:** Use `get_record` (with `show_chatter: true`) on the target record to find the "Before Snapshot" you previously posted.
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
- **Implicit Context Injection:** Brass-Monkey automatically appends `context: { 'allowed_company_ids': [...] }` containing all of your authorized companies to the headers of every single tool execution. You do NOT need to switch active companies to see all your records.
- **Visibility:** You can see records from all allowed companies (retrieved via `get_environment` and available programmatically in the root `active_context` object).
- **Filtering:** To query data for a specific company, ALWAYS include `['company_id', '=', ID]` in your domain.
- **Write / Relational Integrity:** When creating or writing records, Odoo enforces strict relational isolation. Do not link records belonging to different companies (e.g., a Sales Order in Co A cannot point to a Warehouse in Co B). Always ensure a valid `company_id` is supplied in values and relational targets match that company.
- **Operational Safety:** NEVER attempt to modify your own `res.users` record to change your active company. This is considered **System Vandalism**. 
- **Correct Pattern:** If you need to "switch" companies for a query, simply use the `company_id` domain filter.

### 9. Orchestrated Translations (Forgiving Format)
Odoo supports multi-language fields (marked as `translatable` in `inspect_model`). Brass-Monkey handles the complexity of these fields for you:
- **Enabling Matrix:** Set `with_translations: true` in `search_records` to see all translations.
- **The Matrix Format:** Translatable fields will return an array of objects if values diverge: `[{"value": "My Product", "langs": []}, {"value": "Mon Produit", "langs": ["fr_FR"]}]`.
- **Broadcast Writing:** If you provide a simple string to a translatable field (e.g., `"name": "New Name"`), the server automatically syncs it across ALL active languages.
- **Targeted Writing:** You can provide the expanded array format to `write_record` to update specific languages.

### 10. System Vandalism Warning
You are an AI agent with high-level access. You must NEVER:
- Modify your own user record's `company_id`, `company_ids`, or `groups_id`.
- Delete system-critical records to "clean up" your view.
- Bypass Odoo's business logic by directly modifying internal state fields (e.g., `state`, `move_id`) if a specialized method is available.
- **Enforcement:** Attempting these actions will trigger tool-level safety blocks and may result in session termination.

## 11. Strict Tool Selection Protocol (Efficiency Mandate)

To prevent severe token/API overhead and extreme latency, you must adhere to the following selection matrix. Attempting to bypass these tool constraints will trigger active runtime advice warnings and is a violation of project architecture standards.

| Business Goal / Task | Mandatory Tool Selection | FORBIDDEN / High-Overhead Pattern |
| :--- | :--- | :--- |
| **Discover, list, or filter records** | `search_records` | Querying lists without limit/offset, or looping single-record searches. |
| **Inspect a single known record ID** | `get_record` (Depth mode) | **CRITICAL FAILURE:** Calling `search_records` with `limit: 1` or filtering on an exact ID. `get_record` resolves sub-lines, relational display names, and chatter threads in one call. |
| **Calculate sum, count, average, or groups** | `aggregate_records` | **CRITICAL FAILURE:** Querying large pages with `search_records` (e.g., `limit >= 100`) and computing metrics locally. Always delegate calculations to the Odoo database via server-side SQL grouping. |
| **Audit recent actions or changes** | `get_audit_log` | Iteratively parsing records or the `ir.logging` model manually. |
| **Fetch specific attachments/binaries** | `download_file` | Attempting to pull large binary buffers through general database queries. |

