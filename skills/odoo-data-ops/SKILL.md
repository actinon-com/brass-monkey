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

### 3. Agent-Driven Undo Workflow
If you make a mistake or are asked to "undo" a change:
1. **Locate:** Use `search_read` on the `mail.message` model for the target record to find the "Before Snapshot" you previously posted.
2. **Analyze:** Verify the current record state. Do not attempt a rollback if it violates Odoo's business logic (e.g., trying to revert an invoice that has since been paid).
3. **Revert:** Use `write_record` to re-apply the old values from the snapshot, providing a justification like `"Reverting previous AI action: [Original Reason]"`.

### 4. Handling Relational Fields
- **Many2one:** Pass the integer ID of the target record.
- **X2many (One2many/Many2many):** Use command tuples:
    - `(0, 0, {values})`: Create a new linked record.
    - `(4, id)`: Link an existing record.
    - `(3, id)`: Unlink (but don't delete) a record.
    - `(2, id)`: Unlink and delete a record.
    - `(6, 0, [ids])`: Replace all existing links with this list of IDs.
