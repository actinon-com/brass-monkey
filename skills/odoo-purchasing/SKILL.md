---
name: odoo-purchasing
description: MANDATORY for RFQs and Purchase Orders (purchase.order). Expertise in Odoo's procurement engine and vendor pricing.
---
# Skill: Odoo Purchasing & Procurement

This skill provides the agent with high-level functional expertise in Odoo's Purchasing engine, covering Requests for Quotation (RFQs), Purchase Orders (POs), and Vendor Price management.

## Core Mandates

### 1. The Procurement Lifecycle
- **States:** `draft` (RFQ) -> `sent` (RFQ Sent) -> `purchase` (Confirmed PO) -> `done` (Locked) -> `cancel`.
- **Confirmation Trigger:** Confirming a PO (`button_confirm`) is a critical event that automatically triggers incoming **Receipts (`stock.picking`)** in the Inventory module.

### 2. Vendor Pricing & Lead Times
- **Pricelists:** Supplier pricing is managed via **Vendor Pricelists (`product.supplierinfo`)**.
- **Data Pulling:** When adding a product to a PO line, Odoo automatically retrieves the price, discount, and lead time from the best-matching `supplierinfo` record for that Vendor.
- **Mandate:** Always verify if a `supplierinfo` record exists before manually overriding prices.

### 3. Billing Control (3-Way Matching)
Understand when a vendor bill should be recorded:
- **Ordered Quantities:** Bill the vendor for the full amount as soon as the PO is confirmed.
- **Received Quantities:** ONLY bill for what has been physically received in the warehouse.
- **Mandate:** Use the `qty_received` field to verify arrivals before suggesting the creation of an `account.move` (Vendor Bill).

### 4. Advanced Fulfillment (Dropshipping)
- **Workflow:** If the customer's address is used as the `dest_address_id`, the vendor ships directly to the customer. The agent must understand that no internal stock move occurs, but the `qty_received` must still be validated to trigger billing.

## Available Resources
- `purchasing-logic.md`: Deep-dive into Billing Control, Supplierinfo evaluation, and Dropshipping.
- `purchasing-fields.json`: Dense technical map of fields for Order, Line, and Supplierinfo models.
