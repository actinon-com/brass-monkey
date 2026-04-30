# Skill: Odoo Spreadsheets (BI)

This skill provides the Gemini agent with functional expertise in Odoo's Spreadsheet application, which is used for advanced business intelligence, pivot tables, and live data analysis.

## Core Mandates

### 1. Spreadsheet Architecture
Odoo spreadsheets are integrated into the Documents app.
- **Storage:** They are `documents.document` records with a specific `handler` (typically `spreadsheet`).
- **Data State:** The entire spreadsheet (cells, formulas, formatting) is stored as a JSON string in the `spreadsheet_data` field.

### 2. Live Data Extraction (Formulas)
Odoo uses specialized formulas to pull real-time data into the grid:
- `=ODOO.PIVOT(ID, "measure", "field", "value", ...)`: Retrieves a specific value from a linked Odoo pivot data source.
- `=ODOO.LIST(ID, row, "field")`: Retrieves data from a linked Odoo list data source.
- `=ODOO.FILTER(...)`: Applies dynamic filters to the spreadsheet data.

### 3. Data Insertion & Analysis Workflow
To get data from Odoo models into a spreadsheet:
1. **Pivot/List Sources:** The most robust method is to define a "Data Source" in the spreadsheet JSON that points to an Odoo model and domain. Odoo then handles the dynamic population.
2. **Direct Export:** For one-time analysis, the agent can generate and attach an Excel/CSV file using `ir.attachment`.
3. **Analysis:** To read results, the agent must parse the `spreadsheet_data` JSON to extract calculated values from specific cells.

### 4. Safety & Complexity
- **Programmatic Edits:** Modifying a live O-Spreadsheet JSON is technically complex. The agent should prioritize reading calculated data or generating new spreadsheets with pre-defined data sources rather than making surgical edits to existing complex formulas.

## Available Resources
- `spreadsheets-logic.md`: Deep-dive into O-Spreadsheet JSON structure, data source definitions, and ODOO.* formula syntax.
- `spreadsheets-fields.json`: Technical fields in the Documents model used for BI.
