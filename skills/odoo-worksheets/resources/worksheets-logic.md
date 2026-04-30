# Odoo Worksheets Logic & Workflows

## Dynamic Model Generation
The worksheet engine utilizes Odoo's "Studio" mechanics.
- **Model Identity:** When a `worksheet.template` is created, Odoo registers a new `ir.model` with a name like `x_worksheet_template_N`.
- **Field Persistence:** Custom fields added via the UI are stored in the `ir.model.fields` registry under this new model.
- **Agent Role:** The agent should use `inspect_model` on the dynamic model name to understand which custom fields are available for data entry or analysis.

## Module Integrations
The way a worksheet links to its "Host" depends on the module:
- **Field Service (FSM):** The dynamic model contains a `x_project_task_id` many2one field.
- **Quality Control:** The dynamic model contains a `x_quality_check_id` many2one field.
- **Inverse Linking:** The `project.task` or `quality.check` record stores the ID of the worksheet record in a field usually named `worksheet_id` or similar.

## Digital Reporting
- **PDF Generation:** Odoo doesn't just print the Task; it executes a specialized report action that pulls data from the dynamic worksheet model.
- **Signature Context:** In FSM, the signature is captured on the Task but displayed on the Worksheet report. The agent must ensure both records are correctly synced before assuming a report is ready.

## Modification Safety
- **Mandate:** NEVER attempt to modify the technical structure of a dynamic worksheet model (the `ir.model.fields`) unless explicitly instructed for a development task. Focus only on managing the *data* within the existing fields.
