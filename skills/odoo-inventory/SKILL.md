---
name: odoo-inventory
description: MANDATORY for Transfers (stock.picking), Stock Moves (stock.move), and Locations (stock.location). Expertise in Odoo's logistics and warehouse structure.
---
# Skill: Odoo Inventory & Logistics

This skill provides the agent with the expertise required to manage Odoo's inventory operations, covering transfers (pickings), stock moves, and the physical warehouse structure.

## Core Mandates

### 1. Snapshot Awareness (Dynamic Discovery)
- **Mandate:** The `inventory-fields.json` resource is a **snapshot** of common logistics fields. It is NOT exhaustive.
- **Verification:** If a task requires absolute technical precision or if the user references attributes not in your resource, you **MUST** call `inspect_model` to retrieve the "Live Truth" from the target Odoo instance.

### 2. The Inventory Flow (Pickings & Moves)
Inventory operations are centered around the **Transfer (`stock.picking`)**.
- **Picking:** The "envelope" or document (e.g., WH/OUT/001).
- **Move (`stock.move`):** The individual lines on the picking (e.g., "10 units of Product A").
- **State Lifecycle:**
    - `draft`: Document is being prepared.
    - `waiting`: Waiting for another operation to complete.
    - `confirmed`: Waiting for products to be available in stock.
    - `assigned`: Products are reserved and the transfer is **Ready** to process.
    - `done`: The physical move has occurred and stock levels have updated.

### 2. Physical vs. Virtual Locations
Odoo tracks stock by moving items between **Locations (`stock.location`)**.
- **Internal:** Physical spots in your warehouse (e.g., WH/Stock/Shelf 1). These contribute to your On-Hand quantity.
- **Supplier:** Virtual source for incoming goods.
- **Customer:** Virtual destination for outgoing goods.
- **Inventory Loss:** Used for corrections (Scrap, adjustments).

### 3. Valuation & Costing
Stock valuation logic is typically controlled at the `product.category` level (see `odoo-products` skill).
- **Manual vs. Automated:** Automated valuation creates `account.move` entries for every stock move.
- **Mandate:** Be cautious when processing moves for products with "Automated" valuation, as it impacts the balance sheet immediately.

### 4. Advanced Logistics Configuration
Odoo's logistics engine is driven by **Routes (`stock.route`)** and **Rules (`stock.rule`)**.
- **Pull Rules (Procurement):** Triggered by demand (e.g., a Sale Order). They "pull" stock from a source to a destination.
- **Push Rules:** Triggered by arrival. When stock enters a location, they "push" it further.
- **Putaway Rules (`stock.putaway.rule`):** Direct incoming products to specific bins based on the product, category, or **Storage Category (`stock.storage.category`)**.
- **Packaging (`product.packaging`):** Defines commercial units (e.g., Box of 12). Used for faster entry and barcode scanning.

### 5. Units of Measure (UoM)
- **Categories:** Units are grouped into categories (e.g., Unit, Weight, Working Time). Conversions are ONLY possible within the same category.
- **Reference Unit:** Each category has one reference unit (e.g., "Units" or "kg"). All other units in the category define a ratio against this reference.
- **Mandate:** Changing the UoM on a product with stock moves is extremely dangerous. Always verify the category match before suggesting a conversion.

### 6. Troubleshooting & Diagnostics
When a transfer is stuck or stock levels seem incorrect, follow this workflow:
1. **Unreserved Stock:** If a picking is in `confirmed` but not `assigned`, check if the product has `free_qty` in the source location.
2. **Broken Routes:** If no picking is generated for a Sale Order, check if a valid Route (e.g., "MTO", "Buy") is selected on the product or its category.
3. **Negative Stock:** Check for `stock.quant` records with negative values. This usually indicates a user processed a delivery before recording the receipt.
4. **Putaway Failure:** If receipts are going to a generic "Stock" location instead of specific bins, verify the `stock.putaway.rule` priorities.

## Available Resources
- `inventory-logic.md`: Deep-dive into pickings types, reservation logic, and backorders.
- `inventory-advanced-logic.md`: Advanced guide on routing, putaway, packaging, and UoM.
- `inventory-fields.json`: Dense technical map of fields for Picking, Move, Location, Route, Rule, and UoM models.
