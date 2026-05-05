---
name: odoo-finance
description: MANDATORY for Customer Invoices (out_invoice), Vendor Bills (in_invoice), and Payments (account.payment). High-level expertise in Odoo's unified ledger and banking.
---
# Skill: Odoo Finance & Accounting

This skill provides the Gemini agent with high-level business expertise in Odoo's unified accounting engine, covering Invoicing, Billing, Banking, Consolidation, and Analytics.

## Core Mandates

### 1. Snapshot Awareness (Dynamic Discovery)
- **Mandate:** The `finance-fields.json` resource is a **snapshot** of core accounting fields. It is NOT exhaustive.
- **Verification:** If a task requires absolute technical precision or if the user references fields not in your resource, you **MUST** call `inspect_model` to retrieve the "Live Truth" from the target Odoo instance.

### 2. The Unified Ledger (`account.move`)
Odoo uses a single model for Invoices, Bills, and Journal Entries.
- **Move Type:** Dictates behavior (`out_invoice` = Customer Invoice, `in_invoice` = Vendor Bill, `entry` = Journal Entry).
- **Double-Entry Mandate:** For pure journal entries (`entry`), the sum of Debits must equal the sum of Credits across all `account.move.line` records.

### 2. Invoicing Lifecycle
- **States:** `draft` (Editable) -> `posted` (Locked, valid in ledger) -> `cancel`.
- **Payment States:** `not_paid`, `in_payment` (Matched with statement line), `paid` (Reconciled).
- **Mandate:** NEVER attempt to modify a `posted` entry. You must reset to draft first (if permitted) or create a Reversal/Credit Note.

### 3. Banking & Reconciliation
- **Flow:** Import Bank Statements (`account.bank.statement`) -> Run Reconciliation Models -> Match with Invoices/Bills or post to Expense/Income accounts.
- **Suspense Account:** Transactions sit here until they are reconciled.

### 4. Advanced Configuration
- **Fiscal Positions:** Automatically map Taxes and Accounts based on the partner's country/VAT.
- **Journals:** Categorize transactions (Sales, Purchase, Bank, Cash, General). Each journal has its own sequence.

### 5. Analytics & Budgets
- **Analytic Distribution:** Use the `analytic_distribution` (JSON) field on lines to allocate costs/revenues across analytic accounts without creating new ledger entries.
- **Budgets:** Compare `planned_amount` vs. `practical_amount` (actuals) to track financial health.

## Available Resources
- `finance-advanced-logic.md`: Deep-dive into Tax Reporting, Consolidation, Currency handling, and Online Payments.
- `finance-fields.json`: Dense technical map of fields for Move, Line, Account, Journal, Tax, and Analytic models.
