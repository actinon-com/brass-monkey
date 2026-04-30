# Odoo Field Service Logic & Workflows

## Material Consumption on Tasks
Technicians often consume physical parts during an intervention.
- **Workflow:** When a technician adds a product to a task, Odoo creates a corresponding line on a hidden **Sales Order** linked to the task.
- **Stock Moves:** If the product is storable, Odoo automatically generates a delivery move.
- **Technician Stock:** Many FSM setups use "Technician Locations" (e.g., WH/Truck 1). The agent should check the `location_id` on stock moves to verify which "truck" the part was taken from.

## Worksheet Custom Models
When you create a `worksheet.template`, Odoo dynamically generates a **New Technical Model** specifically for that form (e.g., `x_worksheet_template_1`).
- **Data Storage:** The actual answers to the digital form are stored in this dynamic model.
- **Linking:** The `project.task` record has a many2one field pointing to the record in this dynamic model.
- **Mandate:** To read the specific details of a technician's findings, the agent must first find the dynamic model name via the template and then query that model using the task's link.

## Signatures & Final Reports
- **Signature:** Stored as binary data in the `worksheet_signature` field on the task.
- **Report Generation:** Odoo combines the Task data, Worksheet answers, and Signature into a single PDF report.
- **Mandate:** The final report should only be sent to the customer once `fsm_done` is true and the signature is present.

## Planning & Scheduling
- **Gantt View:** FSM tasks are typically managed in a Gantt view using `planned_date_begin` and `date_deadline`.
- **Conflict Management:** Technicians cannot be assigned to overlapping tasks. The agent should verify availability before suggesting a schedule change.
