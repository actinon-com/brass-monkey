# Odoo CRM Logic & Pipeline Workflows

## Lead vs. Opportunity
- **Lead:** A prospect that hasn't been qualified yet.
- **Opportunity:** A qualified prospect that you're actively trying to close.
- **Transition:** Converting a Lead to an Opportunity is the single most important workflow in CRM. It involves assigning a **Salesperson** and linking a **Customer**.

## Probabilities & Revenue
- **Expected Revenue:** The total value of the potential deal.
- **Prorated Revenue:** `expected_revenue` * `probability`. Used for forecasting.
- **Automated Probability:** Odoo uses a predictive lead scoring engine to calculate `automated_probability` based on historical data.

## Sales Teams & Stages
- **Sales Team (`crm.team`):** Groups salespeople together. A team can have its own stages.
- **Stages (`crm.stage`):**
    - `New`: Newly created leads.
    - `Qualified`: Basic requirements met.
    - `Proposition`: Offer sent to customer.
    - `Won`: Deal closed successfully.

## Handling Lost Deals
When a deal is lost, you must provide a **Lost Reason (`crm.lost.reason`)**.
- **Common Reasons:** Too Expensive, Lack of features, Competitor won.
- **Archiving:** Lost deals are archived (`active: false`) but remain in the database for analysis.

## Activity Management
- **Type:** Call, Meeting, Email, To-Do.
- **Deadline:** The date by which the activity should be completed.
- **Outcome:** Marking an activity as "Done" allows you to log the result and immediately schedule the "Next Activity".
