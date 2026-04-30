# Odoo Spreadsheet Logic & BI Workflows

## O-Spreadsheet JSON Structure
Odoo uses the O-Spreadsheet engine, which stores the grid state in a structured JSON format.
- **`sheets`**: An array of sheet objects, each containing `cells` (mapped by coordinate like "A1").
- **`dataSources`**: The most critical section for an AI agent. It defines the links to Odoo models.
    - `type: 'pivot'`: Connects to an Odoo pivot view definition.
    - `type: 'list'`: Connects to an Odoo list/tree view with a specific domain.

## Data Insertion Mechanics
To programmatically get data from Odoo into a spreadsheet, you must define a new `dataSource` entry in the JSON:
1. **Model & Domain:** Specify the target technical model (e.g., `sale.order`) and the domain filter.
2. **Measures & Groups:** For pivots, define which fields to aggregate (measures) and which to use for columns/rows.
3. **Synchronization:** Once the JSON is updated, Odoo's frontend engine will automatically fetch and populate the grid based on these definitions.

## Formula Syntax (`ODOO.*`)
- **`ODOO.PIVOT.HEADER(ID, ...)`**: Retrieves the name of a header in a pivot.
- **`ODOO.LIST.HEADER(ID, ...)`**: Retrieves the label of a field in a list.
- **`ODOO.CREDIT.CONFIG(...)`**: Specialized for financial accounting (Odoo v15+).

## BI Workflow
- **Template Usage:** Businesses often create "Spreadsheet Templates" (`spreadsheet.template`). The agent can use these to instantiate new, pre-configured BI reports for specific time periods or departments.
- **Snapshots:** In some versions, Odoo stores a `spreadsheet_snapshot` (binary) which is a static version of the spreadsheet for fast loading.
