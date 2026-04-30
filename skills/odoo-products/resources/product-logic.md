# Odoo Product Logic & Stock Behavior

## Attribute Immutability & Constraints
Odoo's attribute system is strictly locked once applied. 
- **Constraint:** Once a `product.template` has generated variants (`product.product`) that are used in any transaction (Sale, Purchase, Stock Move), you **CANNOT** add, remove, or modify the attribute lines on that template.
- **Mandate:** Always warn the user before attempting to apply attributes to an existing product template with history.

## Variant Explosion Warning
Adding multiple attributes to a template creates a Cartesian product of all values.
- **Example:** A shirt with 10 Colors and 10 Sizes generates **100** `product.product` records.
- **Risk:** Excessive variants ("Variant Explosion") can significantly degrade performance in search, reports, and UI rendering.
- **Mandate:** The agent should analyze the number of combinations before confirming an attribute update. If the resulting variants exceed 50, explicitly ask for confirmation.

## Product Category Properties
`product.category` is the "Master Controller" for product behavior.
- **Account Mapping:** Income, Expense, and Price Difference accounts are typically defined on the Category, not the Product.
- **Inventory Valuation:** The `property_valuation` (Manual vs. Automated) and `property_cost_method` (Standard, FIFO, AVCO) on the category determine how all products in that category are valued.
- **Inheritance:** Products inherit these properties from their category. If a product field (e.g., `property_account_income_id`) is empty, Odoo looks at the Category.

## Stock Quantities (Computed Fields)
Stock values are **computed on-the-fly** and depend on the current context (e.g., specific Warehouse or Location).

- `qty_available`: Quantity currently physically present in stock.
- `virtual_available`: Forecasted quantity (On Hand - Outgoing + Incoming).
- `free_qty`: Quantity available to be reserved (On Hand - Reserved).

## Invoicing & Purchasing Policies
- `invoice_policy`:
    - `order`: Invoice the customer for the full quantity as soon as the SO is confirmed.
    - `delivery`: Only invoice what has been physically delivered.
- `purchase_method`:
    - `purchase`: Create vendor bills based on ordered quantities.
    - `receive`: Only create bills for what has been physically received.

## Storable vs. Consumable
- Use `is_storable: true` if you want Odoo to track inventory levels, valuation, and stock moves.
- Use `is_storable: false` (Consumable) if the product should be handled by logistics (Pickings) but inventory levels are not tracked.
