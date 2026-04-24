# Odoo Core Models Reference

This resource contains optimized, technical schemas for Odoo's foundational business models, verified against the live environment.

## `res.partner` (Contact / Partner)
The primary model for Customers, Vendors, Companies, and Individuals.

| Field | Type | Properties | Description |
|---|---|---|---|
| `id` | `integer` | `readonly` | Unique database ID. |
| `name` | `char` | `required` | Full name of the partner. |
| `is_company` | `boolean` | | True if the partner represents a legal entity. |
| `parent_id` | `many2one` | `relation: res.partner` | Link to the parent company. |
| `email` | `char` | | Primary email address. |
| `phone` | `char` | | Primary phone number. |
| `vat` | `char` | | Tax ID / VAT Number. |
| `property_account_receivable_id` | `many2one` | `required, company-dependent, relation: account.account` | Default AR account. |
| `property_account_payable_id` | `many2one` | `required, company-dependent, relation: account.account` | Default AP account. |
| `type` | `selection` | `options: contact, invoice, delivery, other` | Address usage type. |

## `res.users` (System Users)
Internal users with access to the Odoo backend.

| Field | Type | Properties | Description |
|---|---|---|---|
| `id` | `integer` | `readonly` | Unique database ID. |
| `login` | `char` | `required` | The username or email used to sign in. |
| `partner_id` | `many2one` | `required, relation: res.partner` | The partner record for this user. |
| `company_id` | `many2one` | `required, relation: res.company` | The user's default company. |
| `active` | `boolean` | | False if the user is archived. |
| `share` | `boolean` | `readonly` | True if this is an external/portal user. |

## `res.company` (Organizations)
Multi-company management entities.

| Field | Type | Properties | Description |
|---|---|---|---|
| `id` | `integer` | `readonly` | Unique database ID. |
| `name` | `char` | `required` | Legal name of the organization. |
| `partner_id` | `many2one` | `required, relation: res.partner` | The company's own partner record. |
| `currency_id` | `many2one` | `required, relation: res.currency` | The primary reporting currency. |
| `parent_id` | `many2one` | `relation: res.company` | Parent company for hierarchy. |
