# Odoo Inventory Logic & Behavior

## Picking Types (Operation Types)
Each `stock.picking` belongs to a `picking_type_id`. This determines its behavior:
- **Receipts (IN):** Source: Supplier -> Destination: Internal.
- **Delivery Orders (OUT):** Source: Internal -> Destination: Customer.
- **Internal Transfers (INT):** Source: Internal -> Destination: Internal.
- **Returns:** Special pickings generated when a user reverses a previous delivery or receipt.

## Reservation & Availability
Odoo automatically "reserves" products for assigned pickings.
- **`assigned` (Ready):** The product is reserved in an internal location. The move can now be validated.
- **Force Availability:** In older versions, users could manually force reservation. In newer versions (v16+), this is handled by "Check Availability" buttons.

## Validation & Done Quantities
Validating a transfer creates a physical change in stock.
- **Partial Validation:** If you validate a picking but have only processed half the quantity, Odoo will ask to create a **Backorder**.
- **`qty_done`:** This is the field that tracks how much was actually moved. It must be filled before validating the picking.

## Backorders
- If a picking is only partially completed, Odoo creates a second picking (the Backorder) for the remaining quantity.
- The original picking will have its state set to `done`, and the new one will be `waiting` or `confirmed`.
