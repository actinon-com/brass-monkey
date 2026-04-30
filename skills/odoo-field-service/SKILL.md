# Skill: Odoo Field Service Management (FSM)

This skill provides the Gemini agent with functional expertise in Odoo's Field Service module, which extends Project management for on-site interventions.

## Core Mandates

### 1. FSM Task Architecture
- **Host Project:** A Field Service task is a `project.task` belonging to a project where `is_fsm` is enabled.
- **Location-Centric:** The `partner_id` on the task represents the physical location of the intervention.
- **Mandate:** Always verify the site address (`partner_id`) before dispatching or updating a technician's schedule.

### 2. Intervention Lifecycle
1. **Scheduled:** Dates (`planned_date_begin`, `date_deadline`) are set.
2. **In Progress:** The technician starts the timer (Timesheets).
3. **Materials:** Parts consumed on-site are added to the task, updating a hidden Sales Order.
4. **Worksheet:** A digital form (`worksheet.template`) is filled out.
5. **Signed:** The customer provides a digital signature (`worksheet_signature`).
6. **Done:** The task is marked as `fsm_done`.

### 3. Worksheets & Reporting
- **Templates:** Different types of jobs (e.g., HVAC Repair vs. Plumbing) use different `worksheet_template_id`.
- **Validation:** Mandate that a worksheet must be filled and signed before an FSM task can be closed if a template is required.

### 4. Billing for Service
- **Automatic Invoicing:** If the project is set to "Billable", Odoo can generate an invoice directly from the FSM task based on timesheets and consumed materials.

## Available Resources
- `field-service-logic.md`: Deep-dive into material consumption, worksheet custom models, and mobile-friendly workflows.
- `field-service-fields.json`: Dense technical map of fields for FSM-specific tasks and worksheet templates.
