# Odoo MRP Logic & Engineering Workflows

## ETO & CTO Fulfillment Logic
Manufacturing complex products often requires dynamic BoM behavior.

### Configure to Order (CTO)
- **Mechanism:** BoM lines can be tied to specific `product.template.attribute.value` records.
- **Trigger:** When a variant is selected on a Sales Order, Odoo filters the BoM lines to only include those matching the selected attributes.
- **Agent Role:** Ensure that all mandatory attributes are selected before confirming an MO generated from a CTO sale.

### Engineer to Order (ETO)
- **Mechanism:** MOs created for unique, bespoke products where the final component list is not known at the start.
- **Workflow:** The MO is confirmed with an "Incomplete" BoM. Components and Operations are added to the MO directly as the engineering process progresses.
- **Integration:** Often linked to a `project.task` where the design phase occurs.

## PLM & Version Control
- **ECOs (`mrp.eco`):** Engineering Change Orders are the vehicle for modifying a BoM. They track who approved the change and why.
- **BoM Versioning:** PLM allows you to keep the `old` version of a BoM active while the `new` version is being engineered.
- **Conflict Resolution:** If multiple ECOs are open for the same BoM, Odoo PLM provides tools to rebase and merge changes.

## Subcontracting
- **Mechanism:** Selecting the "Subcontracting" BoM type.
- **Trigger:** Confirming the MO generates a Purchase Order to the subcontractor.
- **Stock:** Components are sent to the Subcontractor's location, and the finished product is received back via a Receipt.

## Work Center Costing
- **Costs:** Calculated as `Duration (min) / 60 * Work Center Hourly Rate`.
- **OEE (Overall Equipment Effectiveness):** Odoo tracks "Time Productive", "Time Loss" (Maintenance), and "Reduced Speed" to provide OEE metrics.
- **Mandate:** Ensure Work Center hourly costs are set accurately on `mrp.workcenter` to get precise production valuation.
