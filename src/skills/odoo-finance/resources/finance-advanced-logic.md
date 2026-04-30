# Odoo Advanced Finance Logic

## Tax Reporting & Grids
Odoo uses **Tax Tags** (`account.account.tag`) to populate country-specific tax returns.
- **Mechanism:** Each `account.tax` has "Tax Repartition Lines". When a tax is applied, it adds Tags to the generated `account.move.line`.
- **Reporting:** The "Tax Report" engine aggregates lines based on these tags to fill boxes on the VAT return.

## Currency & Consolidation
### Multi-Currency
- **Company Currency:** The primary reporting currency.
- **Document Currency:** The currency on the Invoice/Bill.
- **Unrealized Gains/Losses:** At period-end, the "Post Exchange Difference Entries" wizard revalues balance sheet accounts using the latest `res.currency.rate`.

### Consolidation (Multi-Company)
- **Inter-Company Transactions:** Automated rules can generate a Vendor Bill in Company B when Company A validates a Customer Invoice targeting Company B.
- **Consolidation App:** Used to aggregate financial statements across multiple legal entities with different charts of accounts.

## Online Payments
- **Payment Providers (`payment.provider`):** Integrations with Stripe, PayPal, Adyen, etc.
- **The Flow:**
    1. Agent generates a "Payment Link".
    2. Customer pays via the Online Portal.
    3. Odoo creates a `payment.transaction` record.
    4. Upon provider confirmation, Odoo creates an `account.payment` and reconciles it with the Invoice.

## Budgets & Analytics
- **Budgetary Positions:** Group multiple G/L accounts for budget tracking.
- **Analytic Plans:** Odoo v16+ uses Plans (e.g., Projects, Departments) for multi-dimensional analysis.
- **Analytic Distribution:** A line can be distributed as `{"1": 60, "2": 40}` (60% to Account 1, 40% to Account 2).
