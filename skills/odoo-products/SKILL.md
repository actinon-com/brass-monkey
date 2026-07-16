---
name: odoo-products
description: MANDATORY for Product Templates (product.template) and Variants (product.product). Expertise in Odoo's catalog and attribute management.
---
# Skill: Odoo Product Management

This skill provides the agent with the expertise required to manage Odoo's product catalog, covering both the general templates and specific product variants.

## Core Mandates

### 1. Snapshot Awareness (Dynamic Discovery)
- **Mandate:** The `product-fields.json` resource is a **snapshot** of common Odoo fields. It is NOT exhaustive.
- **Verification:** If you need to interact with custom fields or if the user references attributes not in your resource, you **MUST** call `inspect_model` on `product.template` or `product.product` to retrieve the "Live Truth".

### 2. Template vs. Variant
- **Mandate:** When executing stock moves, sales lines, or purchase lines, **ALWAYS** use the ID from `product.product`.

### 2. Attribute Immutability & Safety
- **Mandate:** NEVER attempt to modify `attribute_line_ids` on a `product.template` that has historical transactions. This is a destructive operation in Odoo.
- **Variant Explosion:** Before adding attributes, calculate the total number of variants (Product A x Attribute B x Attribute C). If the resulting count exceeds 50, you **MUST** seek explicit confirmation from the user due to performance risks.

### 3. Category-Based Configuration
- **Mandate:** Do not assume accounting properties (Income/Expense accounts) are set on the product level. Always check the linked `product.category` if these fields are null. The category also determines the inventory valuation method (FIFO/AVCO/Standard).

### 4. Product Types (`type` field)
- `consu` (Goods): Tangible merchandise (storable if `is_storable` is true).
- `service`: Intangible services (never tracked in inventory).
- `combo`: A set of other products sold together.

### 3. Price & Cost
- `list_price`: The base Sales Price (on Template).
- `standard_price`: The Cost price. Note: This is **company-dependent** in many configurations.
- `price_extra`: Additional cost added to a specific Variant (on Product).

### 4. Search Workflow
To find a specific product efficiently:
1. **Reference First:** Search by `barcode` or `default_code` (Internal Reference).
2. **Variants:** If searching for a specific configuration, search `product.product` directly using attribute values.

## Available Resources
- `product-logic.md`: Deep-dive into variant configuration, attributes, and stock valuation logic.
- `product-fields.json`: Dense technical map of fields for both Template and Product models.
