# Odoo Quality Logic & Compliance Workflows

## Control Point Triggers
`quality.point` records determine when checks are automatically generated.
- **Trigger Types:**
    - **Operation:** Triggers upon validation of a specific `stock.picking.type` or `mrp.routing.workcenter`.
    - **Product:** Specific to one `product.product`.
    - **Category:** All products within a `product.category`.
- **Frequency:**
    - `all`: Every single operation generates a check.
    - `random`: Generates checks based on a percentage (e.g., test 10% of items).
    - `periodical`: Generates checks at set intervals (Days/Weeks/Months).

## Measurement Validation
For "Measure" check types, Odoo performs automated validation:
- **Norm:** The target value.
- **Tolerances:** `tolerance_min` and `tolerance_max`.
- **Success:** If `measure` is within the tolerance range, the check state becomes `pass`. Otherwise, it defaults to `fail`.

## Worksheet Integration
Some quality checks require a full form to be filled out.
- **Workflow:** The `quality.check` record points to a `worksheet_template_id`.
- **Completion:** The agent must fill the linked worksheet record (dynamically generated model) before the check can be finalized.
- **FSM Link:** Quality worksheets share the same underlying `worksheet.template` engine used in Field Service, allowing for consistent digital documentation across the company.

## Root Cause Analysis (Alerts)
When a quality non-conformance is detected (manually or via a failed check):
- **Team Assignment:** Alerts are routed to a `quality.alert.team`.
- **Stages:** Alerts move through a pipeline (e.g., New -> Confirmed -> Action Proposed -> Solved).
- **Tags:** Use `tag_ids` to categorize issues (e.g., "Supplier Defect", "Machine Malfunction").
