# Odoo Helpdesk Logic & Integration

## SLA Calculation Logic
Odoo's SLA engine is sophisticated:
- **Triggers:** Based on the ticket reaching a specific `stage_id`.
- **Working Hours:** Calculations respect the `resource_calendar_id` (Working Schedule) of the team.
- **Statuses:**
    - `In Progress`: Deadline is in the future.
    - `Failed`: Target stage was not reached before the deadline.
    - `Reached`: Target reached on time.

## Frontend Configuration (Website & Portal)
- **Website Form:** Use `website_form_view_id` to customize the fields customers fill out when creating a ticket online.
- **Customer Portal:** Customers can view their ticket's `stage_id`, `message_ids` (Comments only), and potentially close their own tickets if `allow_portal_ticket_closing` is enabled.
- **Live Chat:** Tickets can be converted from Live Chat sessions, automatically capturing the chat transcript in the `description`.

## Backend Action Triggers
The Helpdesk agent should act as a dispatcher for technical solutions:
- **Return Processing:** If a ticket requires a product return, the `picking_ids` (many2many) field links to the relevant Stock Pickings.
- **Timesheet Billing:** If `use_helpdesk_sale_timesheet` is enabled, the agent can log hours against a ticket that automatically populate a `sale.order` for billing.
- **Knowledge Link:** Teams can be linked to a `website_article_id` to provide customers with a self-service FAQ before they create a ticket.

## Merging & Deduplication
If a customer sends multiple emails about the same issue, use the "Merge" action to consolidate `message_ids` and `ir.attachment` records into a single master ticket to prevent SLA double-counting.
