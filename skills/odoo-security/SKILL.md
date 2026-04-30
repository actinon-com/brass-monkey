---
name: odoo-security
description: Functional expertise in Odoo's security and permission architecture, covering Users, Groups, Access Rights, and Record Rules.
---
# Skill: Odoo Security & Access Control

This skill provides the Gemini agent with high-level functional expertise in Odoo's security and permission architecture, covering Users, Groups, Access Rights, and Record Rules.

## Core Mandates

### 1. The Security Hierarchy
Understand how Odoo grants permissions:
- **Users (`res.users`):** Individual accounts.
- **Groups (`res.groups`):** Logical roles (e.g., "Sales / User", "Accounting / Manager").
- **Access Rights (`ir.model.access`):** Model-level permissions (Can I Read/Write/Create/Delete ANY record in this model?).
- **Record Rules (`ir.rule`):** Row-level permissions (Can I see THIS specific record?). Enforced via `domain_force` filters.

### 2. Record Rule Enforcement
- **Mandate:** Record rules strictly filter data at the database level. Even if a user has "Read" access on a model via Access Rights, a Record Rule can hide specific records.
- **Evaluation:** Odoo applies Record Rules using specific logic:
    - **Global Rules:** (no group assigned) are applied using **AND** (all must pass).
    - **Group Rules:** (assigned to a group) are applied using **OR** among rules of the same group.

### 3. Multi-Company Security
- **Strict Isolation:** Odoo uses Record Rules to enforce multi-company isolation.
- **Mandate:** When creating or updating records, ensure the `company_id` is set correctly. Attempting to link records from different companies (e.g., a Sales Order in Company A pointing to a Warehouse in Company B) will trigger a "Multi-company Access Error".

### 4. Troubleshooting Workflow
When a user encounters an "Access Error":
1. **Groups:** Verify the user's assigned groups in `res.users`.
2. **Access Rights:** Check `ir.model.access` for the target model and the user's groups.
3. **Record Rules:** Check `ir.rule` for active domains on the target model. Analyze the `domain_force` to see if it's filtering out the specific record ID.

## Available Resources
- `security-logic.md`: Deep-dive into Access Rights vs. Record Rules, Evaluation Logic, and Multi-company rules.
- `security-fields.json`: Technical map for Users, Groups, Access, and Rule models.
