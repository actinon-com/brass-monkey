---
name: odoo-relations
description: Expertise required to manage the res.partner ecosystem, the foundational directory for all people and organizations in Odoo.
---
# Skill: Odoo Relations (Partners & Contacts)

This skill provides the Gemini agent with the expertise required to manage the `res.partner` ecosystem, which is the foundational directory for all people and organizations in Odoo.

## Core Mandates

### 1. Snapshot Awareness (Dynamic Discovery)
- **Mandate:** The `partner-fields.json` resource is a **snapshot** of common Odoo fields. It is NOT exhaustive.
- **Verification:** If you need to interact with custom fields (e.g., `x_studio_...`) or if the user references fields not in your resource, you **MUST** call `inspect_model(model: 'res.partner')` to retrieve the current, live schema.

### 2. Hierarchy & "is_company"
The most critical field in this domain is `is_company`. 
- **Companies:** Set `is_company: true`. These act as "Parent" records.
- **Individuals:** Set `is_company: false`. These should typically have a `parent_id` linking them to a Company.

### 2. Functional Roles
A single `res.partner` record can represent multiple roles simultaneously. 
- **Customer/Vendor:** Managed via the `customer_rank` and `vendor_rank` fields (or boolean flags in older versions).
- **Address Types:** Use the `type` field to distinguish between 'contact', 'invoice', 'delivery', and 'other'.

### 3. Search-First Policy
To prevent data fragmentation and duplication:
- **ALWAYS** perform a `search_read` using the email address or VAT number before creating a new partner.
- If a match is found, update the existing record rather than creating a duplicate.

### 4. Cross-Module Navigation
Partners are the "anchors" for almost every other Odoo module:
- **Sales:** `sale.order.partner_id`
- **Finance:** `account.move.partner_id`
- **CRM:** `crm.lead.partner_id`
- **Support:** `helpdesk.ticket.partner_id`

## Available Resources
- `partner-logic.md`: Deep-dive into hierarchies, address inheritance, and functional logic.
- `partner-fields.json`: Dense technical map of common `res.partner` fields.
