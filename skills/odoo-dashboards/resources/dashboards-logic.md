# Odoo Dashboards Logic & BI Workflows

## Departmental Organization
Dashboards are designed to be clustered by business function.
- **`spreadsheet.dashboard.group`**: Act as the "Folders" in the Dashboard sidebar. Common groups include "Sales", "Accounting", "Inventory", and "Human Resources".
- **Access Control:** Groups can be restricted to specific user roles via the `group_ids` field (many2many with `res.groups`). The agent should check these permissions if a user reports a missing dashboard.

## Publishing & Sequence
- **`is_published`**: A boolean flag. Only published dashboards are visible in the general Dashboard UI.
- **UI Sequence:** The Odoo sidebar renders groups and their children based on the `sequence` field (lower numbers appear at the top).

## Spreadsheet Synchronization
While dashboards are specialized records, they share the O-Spreadsheet JSON format.
- **Link to Documents:** In some configurations, a dashboard may be created by "pinning" a Spreadsheet from the Documents app.
- **Independent State:** Once created, a dashboard often maintains its own `spreadsheet_data` separate from the original spreadsheet.

## Data Freshness
- **Dynamic Calculation:** Although the view is read-only, the ODOO.* formulas within the JSON are executed by the browser whenever a user views the dashboard, ensuring the data is always real-time.
