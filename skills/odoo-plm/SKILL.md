---
name: odoo-plm
description: High-level functional expertise in Odoo's PLM module, covering Engineering Change Orders, BoM versioning, and change approvals.
---
# Skill: Odoo PLM (Product Lifecycle Management)

This skill provides the agent with high-level functional expertise in Odoo's PLM module, covering Engineering Change Orders (ECO), BoM versioning, and change approvals.

## Core Mandates

### 1. Structure of a Change (ECO)
- **Proposed Changes:** Instead of modifying a live BoM, use an **Engineering Change Order (`mrp.eco`)** to propose modifications.
- **Types:** ECOs are categorized by **Type (`mrp.eco.type`)**, such as 'BoM Change' or 'Routing Change'.
- **Workflow:** ECOs move through **Stages (`mrp.eco.stage`)**.

### 2. Prohibited Direct Edits
- **Mandate:** If the PLM module is installed, the agent is strictly forbidden from using `write_record` to modify an active `mrp.bom`. All changes must be routed through an `mrp.eco`.

### 3. Change Tracking
- **BoM Changes (`mrp.eco.bom.change`):** Tracks the addition, removal, or quantity update of components.
- **Routing Changes (`mrp.eco.routing.change`):** Tracks modifications to manufacturing operations or work center assignments.

### 4. Approvals & Application
- **Approval Flow:** Each stage can require one or more approvals. Use `search_read` on `mrp.eco.approval` to verify if a change is ready to be applied.
- **Applying Changes:** Once approved and moved to the "Apply" stage, Odoo archives the old BoM version and activates the new version created by the ECO.

## Available Resources
- `plm-logic.md`: Deep-dive into version control, conflict resolution, and effectivity dates.
- `plm-fields.json`: Dense technical map of fields for ECO, Type, Stage, and Change models.
