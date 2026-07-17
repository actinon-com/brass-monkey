---
name: odoo-helpdesk
description: MANDATORY for Tickets (helpdesk.ticket) and SLAs (helpdesk.sla). Expertise in Odoo's support engine and customer service.
---
# Skill: Odoo Helpdesk & Customer Support

This skill provides the agent with high-level functional expertise in Odoo's Customer Support engine, covering Ticket management, SLA compliance, and multi-channel integration.

## Core Mandates

### 1. Ticket Lifecycle & Routing
- **Creation:** Tickets are generated via Email Aliases, Website Forms, Live Chat, or manual entry.
- **Routing:** Every ticket belongs to a **Helpdesk Team (`helpdesk.team`)**, which dictates the available stages and assignment method (Manual, Random, Balanced).
- **Stages:** Progression is tracked via **Stages (`helpdesk.stage`)**. Tickets in "folded" stages are considered closed.

### 2. SLA Compliance
- **Deadlines:** **Service Level Agreements (`helpdesk.sla`)** calculate the `sla_deadline` based on the ticket's priority and team configuration.
- **Mandate:** Always prioritize tickets with the earliest `sla_deadline` to avoid breach. Use the `sla_reached` flag to verify compliance.

### 3. Integrated Resolution (Backend/Frontend)
Helpdesk is the bridge between a customer problem and a technical solution:
- **Returns:** If a product is faulty, link/create a **Return (`stock.picking`)** from the ticket.
- **Field Service:** If on-site work is required, generate a **Task (`project.task`)**.
- **Sales/Invoicing:** Reference the original `sale.order_id` to verify warranty status or bill for support time via `sale_line_id`.

### 4. Communication Protocol
- **Public Reply:** Use `message_post` with `message_type: 'comment'` and `body_is_html: true` (if sending HTML) for messages sent directly to the customer.
- **Internal Note:** Use `message_post` with `subtype_xmlid: 'mail.mt_note'` and `body_is_html: true` (if sending HTML) for internal technical updates.
- **Mandate:** Clearly distinguish between the two. Never leak internal technical jargon to the customer.

## Available Resources
- `helpdesk-logic.md`: Deep-dive into SLA calculations, Website/Portal configuration, and action triggers for Returns/Repairs.
- `helpdesk-fields.json`: Dense technical map of fields for Ticket, Team, Stage, and SLA models.
