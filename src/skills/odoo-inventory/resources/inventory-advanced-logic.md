# Odoo Advanced Inventory Logic

## Logistics Routing Engine
Odoo uses a "Rule-based" engine to automate movement.

### Routes (`stock.route`)
A Route is a collection of Rules. It defines a high-level path (e.g., "Buy", "Manufacture", "Dropship").
- **Applicability:** Routes can be selected on the Product, Product Category, Warehouse, or Sale Order Line.
- **Priority:** Product level overrides Category level, which overrides Warehouse level.

### Rules (`stock.rule`)
- **Pull (Procurement):** Created when demand is generated. If a user sells a product, a Pull rule "pulls" it from Stock to Customer. If Stock is empty, it may trigger another Pull rule to "pull" it from a Vendor (Buy).
- **Push:** Created when a product arrives. If a product enters "Input", a Push rule "pushes" it to "Quality Control".
- **Supply Methods:**
    - `make_to_stock` (MTS): Take from existing inventory.
    - `make_to_order` (MTO): Trigger another rule immediately, regardless of stock level.

## Putaway & Storage
### Putaway Rules (`stock.putaway.rule`)
Determines the "best" sub-location for a product when it arrives at a warehouse.
- **Criteria:** Can be based on Product, Category, or **Package Type**.
- **Storage Categories:** If a location has a `storage_category_id`, Odoo checks its capacity constraints (weight, volume) before suggesting it.

## Packaging vs. Tracking
### Product Packaging (`product.packaging`)
- **Purpose:** Commercial definition (e.g., "Box of 12", "Pallet of 144").
- **Usage:** Speeds up Sales and Purchase entry. Scanning a "Box" barcode adds 12 units automatically.

### Stock Packages (`stock.quant.package`)
- **Purpose:** Physical tracking of a container. A unique physical box with a unique ID (SSCC).
- **Usage:** Used to move multiple different products together as a single unit.

## Units of Measure (UoM)
- **Hierarchy:** `uom.category` (The dimension) -> `uom.uom` (The unit).
- **Conversion:** `Ratio` is defined against the category's reference unit.
- **Master Rule:** NEVER change the UoM category on a product once it has been used. If a product was "Units" and needs to be "kg", you must archive it and create a new one.
