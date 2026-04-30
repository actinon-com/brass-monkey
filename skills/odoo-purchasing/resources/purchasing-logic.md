# Odoo Purchasing Logic & Vendor Management

## Billing Control Policies
- **`purchase` (Ordered Quantities):** The `invoice_status` becomes `to invoice` as soon as the PO is confirmed.
- **`receive` (Received Quantities):** The `invoice_status` remains `no` until a Receipt (`stock.picking`) is validated. This is Odoo's default for storable products to ensure **3-Way Matching** (PO vs. Receipt vs. Bill).

## Vendor Pricelists (`product.supplierinfo`)
Odoo selects the best price based on:
1. **Vendor:** Matching the `partner_id` on the PO.
2. **Quantity:** If the vendor offers a discount for 100+ units, Odoo checks `min_qty`.
3. **Date:** Odoo verifies the `date_start` and `date_end`.
4. **Sequence:** If multiple valid lines exist, the one with the lowest `sequence` is chosen.

## Dropshipping Workflow
- **Trigger:** Selected as a Route on the Product or SO line.
- **PO Destination:** The `dest_address_id` on the PO is set to the **Customer's address**.
- **Logistics:** A "Dropship" picking type is used. The agent must acknowledge that stock does not enter the company's physical locations.

## Purchase Agreements
- **Blanket Orders:** Long-term agreements for set prices/quantities.
- **Call for Tenders:** Comparing multiple RFQs from different vendors for the same requirement.
