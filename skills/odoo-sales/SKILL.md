---
name: odoo-sales
description: MANDATORY for Sales Orders (sale.order), Quotations, and Order Fulfillment. Functional expertise in Odoo's Sales engine and lifecycle states.
---
# Skill: Odoo Sales & Order Fulfillment

This skill provides the Gemini agent with high-level functional expertise in Odoo's Sales engine, covering the entire lifecycle from Quotation to Order Fulfillment (Shipping, Manufacturing, Services).

## Core Mandates

### 1. The Sales Lifecycle
- **States:** `draft` (Quotation) -> `sent` (Quotation Sent) -> `sale` (Confirmed Order) -> `cancel`.
- **Confirmation Trigger:** Confirming an SO (`action_confirm`) is a critical event that automatically triggers downstream operations (e.g., Delivery Orders, Manufacturing Orders, or Project Tasks).

### 2. Line Management & Pricing
- **Product Identification:** ALWAYS use the `product.product` ID on lines.
- **Pricelists:** Pricing is dynamically determined by the `pricelist_id`. Do not assume the price on the line is static; it may change based on quantities or customer tiers.
- **Taxes:** Taxes are computed automatically based on the product and the `fiscal_position_id` of the partner.

### 3. Invoicing Policies
Understand when an order is ready for billing:
- **Ordered Quantities:** Invoice the customer as soon as the SO is confirmed.
- **Delivered Quantities:** Only invoice what has been physically shipped or performed.
- **Check:** Use the `invoice_status` field to determine if a record is `to invoice`.

### 4. Advanced Fulfillment Strategies
Support complex business scenarios:
- **Services:** Manage `service_tracking` to create Projects or Tasks automatically upon confirmation.
- **Make to Order (MTO) / Build to Order (BTO):** Understand how routes trigger immediate supply chain actions.
- **Engineer to Order (ETO):** Link Sales Orders to bespoke design Tasks before final quoting.
- **Dropshipping:** Automatically generate a Purchase Order targeting the customer's address.

## Available Resources
- `sales-logic.md`: Deep-dive into fulfillment scenarios (MTO, ETO, Services), Pricelists, and Invoicing rules.
- `sales-fields.json`: Dense technical map of fields for Order, Line, Pricelist, and Payment Term models.
