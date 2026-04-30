---
name: odoo-worksheets
description: Functional expertise in Odoo's Worksheet engine for creating custom, dynamic digital forms in Field Service and Quality modules.
---
# Skill: Odoo Worksheets

This skill provides the Gemini agent with functional expertise in Odoo's Worksheet engine, which allows for the creation of custom, dynamic digital forms in Field Service and Quality modules.

## Core Mandates

### 1. Dynamic Architecture
Unlike standard Odoo models, every unique worksheet template generates its own technical model (e.g., `x_worksheet_template_1`).
- **Data Location:** The actual "Answers" to a worksheet are NOT stored on the Task or Quality Check itself, but in these dynamically created models.
- **Linking:** The parent record (Host) has a many2one field pointing to the dynamic worksheet record.

### 2. The Data Retrieval Workflow
When you need to read the content of a worksheet attached to a record:
1. **Find the Template:** Read the `worksheet_template_id` from the host record (e.g., `project.task` or `quality.check`).
2. **Find the Model:** Inspect the `worksheet.template` to find the `model_id` (the technical model name).
3. **Query the Answers:** Perform a `search_read` on that technical model, filtering by the host record's ID (typically `x_project_task_id` or `x_quality_check_id`).

### 3. Verification & Compliance
- **Validation:** If a worksheet is required, the host record cannot be finalized (marked Done or Pass) until the worksheet record has been created and validated.
- **Reporting:** Odoo generates specialized PDF reports that merge the host record's metadata with the worksheet's custom fields.

## Available Resources
- `worksheets-logic.md`: Deep-dive into dynamic model generation, cross-module integration, and reporting.
- `worksheets-fields.json`: Technical map for the template engine.
