---
name: odoo-mrp
description: High-level functional expertise in Odoo's Manufacturing and Product Lifecycle Management engines, covering production planning, execution, and engineering changes.
---
# Skill: Odoo MRP (Manufacturing) & PLM

This skill provides the Gemini agent with high-level functional expertise in Odoo's Manufacturing and Product Lifecycle Management (PLM) engines, covering production planning, execution, and engineering changes.

## Core Mandates

### 1. The Production Lifecycle
- **States:** `draft` -> `confirmed` (Materials reserved) -> `progress` (Operations started) -> `to_close` -> `done`.
- **Mandate:** When an MO is confirmed, Odoo automatically triggers components reservations and generates Work Orders based on the BoM.

### 2. Bills of Materials (BoM)
- **Manufacture:** Standard BoM that generates a Manufacturing Order.
- **Kit (Phantom):** A bundle of products that are "broken down" into components upon Sales Order delivery (no MO is created).
- **Subcontracting:** The BoM triggers a Purchase Order to a vendor who performs the assembly.

### 3. Dynamic BoMs (ETO & CTO)
Support for complex engineering and configuration scenarios:
- **Configure to Order (CTO):** BoM components and operations are dynamically selected based on Product Attributes and Variant Values.
- **Engineer to Order (ETO):** MOs that allow for "Incomplete" BoMs, where the agent or technical team adds components and operations on-the-fly during the production process.
- **Mandate:** If a BoM is marked as incomplete or part of an ETO flow, the agent should proactively check for additional requirements before closing the MO.

### 4. Integration with PLM
- **Engineering Change Orders (ECO):** Use `mrp.eco` to track modifications to BoM structures.
- **Versioning:** Odoo PLM tracks multiple versions of a BoM. Always verify you are using the `active` version unless a specific ECO is being implemented.

### 5. Work Center Execution
- **Work Orders (`mrp.workorder`):** Represent the physical work performed. 
- **Tracking:** Real duration is logged against `mrp.workcenter`.
- **Mandate:** All operations must be marked as `done` before the master MO can be closed.

## Available Resources
- `mrp-logic.md`: Deep-dive into ETO/CTO dynamic BoMs, Subcontracting, and Work Center costing.
- `mrp-fields.json`: Dense technical map of fields for Production, BoM, Work Order, and ECO models.
