# Odoo Sales Logic & Fulfillment Strategies

## Invoicing Policies
- **`order` (Ordered Quantities):** The `invoice_status` becomes `to invoice` as soon as the SO is confirmed. This is standard for services or prepayments.
- **`delivery` (Delivered Quantities):** The `invoice_status` remains `no` until the linked `stock.picking` is validated or timesheets are recorded.

## Fulfillment Scenarios

### Services & Timesheets
Service products can be configured to automate project management:
- **Tracking:** `no` (Standard service), `task_global_project` (Add task to specific project), `project_only` (Create a new project per SO), `task_in_project` (Create task in SO's project).
- **Invoicing:** Based on **Timesheets** (actual hours recorded) or **Milestones** (manually validated progress).

### Make to Order (MTO) / Build to Order (BTO)
- **Logic:** Triggered by selecting the "Replenish on Order" (MTO) route on the product.
- **Result:** Confirming the SO immediately generates a draft Manufacturing Order (`mrp.production`) or a Purchase Order (`purchase.order`).
- **Linking:** The SO line is linked to the generated procurement via the `procurement_group_id`.

### Configure to Order (CTO)
- **Logic:** Uses product attributes to define a specific variant during the sales process.
- **Mechanism:** The agent passes a list of `product_template_attribute_value_ids` to the SO line.

### Engineer to Order (ETO)
- **Workflow:** 
    1. Agent creates an SO with a "Service" line.
    2. Confirmation creates a Task.
    3. Technical team adds materials/hours to the Task.
    4. SO is updated or re-quoted based on the Task's actual requirements before final production.

## Pricing Evaluation
Odoo evaluates prices in a specific sequence:
1. **Manual Override:** If a user manually sets `price_unit`.
2. **Pricelist Rule:** Based on quantity, date range, or customer category.
3. **Product Standard Price:** The fallback Sales Price.
