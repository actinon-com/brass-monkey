# Skill: Odoo Reports

This skill provides the Gemini agent with the expertise required to discover, generate, and analyze Odoo business reports (e.g., Invoices, Quotations, and Packing Slips).

## Core Mandates

### 1. Report Architecture
Odoo reports are stored in the `ir.actions.report` model. They are typically rendered using the QWeb engine into PDF or HTML formats. Every report is linked to a specific business model (e.g., `sale.order`).

### 2. Workflow for Generating Reports
1. **Find:** Use `list_reports` with a `model` (e.g., `account.move`) to find the technical `report_name` or `id` (e.g., `account.report_invoice`).
2. **Execute:** Use `download_report` with the report ID/name and the IDs of the records you want to print (e.g., `[101]`).
3. **Analyze:** Once the file is downloaded to the local workspace, use standard workspace tools (like `read_file` or `pdf_to_text`) to extract and analyze the content.

### 3. Contextual Rationale
When downloading a report, provide a `justification` as part of the tool call. This is particularly important for models that track "Printing" or "Sending" events (e.g., Odoo may automatically mark an invoice as "Sent" when it is rendered).

*Note: Both report tools support the `instance_alias` parameter.*

## Available Resources
- `qweb-basics.md`: Reference for Odoo's XML templating directives, which are used to construct report layouts.
