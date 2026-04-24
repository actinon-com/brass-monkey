# Odoo Partner Logic & Hierarchies

## The Parent-Child Relationship
Odoo uses a recursive structure for partners. 

### Company (The Parent)
- `is_company` is `true`.
- Holds the primary VAT, Website, and primary address.
- `child_ids` contains all employees and secondary addresses.

### Individual/Employee (The Child)
- `is_company` is `false`.
- `parent_id` points to the Company.
- **Inheritance:** By default, child records inherit the address and commercial properties of the parent unless overridden.

## Address Types (`type` field)
When adding a record to `child_ids`, use the `type` field to define its purpose:
- `contact`: A standard employee or person at the company.
- `invoice`: The specific address where invoices should be mailed.
- `delivery`: The specific address for shipping goods.
- `other`: Specialized addresses (e.g., technical support site).

## Commercial Entities
Odoo uses `commercial_partner_id` (read-only) to group multiple legal entities into a single financial group. This is used by the Accounting module for credit limits and consolidated reporting.
