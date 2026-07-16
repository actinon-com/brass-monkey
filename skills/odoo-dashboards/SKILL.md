---
name: odoo-dashboards
description: Functional expertise in Odoo's Dashboard application, covering how spreadsheets are organized and presented as read-only BI reports.
---
# Skill: Odoo Dashboards

This skill provides the agent with functional expertise in Odoo's Dashboard application, covering how spreadsheets are organized and presented as read-only BI reports.

## Core Mandates

### 1. Dashboard Architecture
Modern Odoo dashboards are based on the O-Spreadsheet engine.
- **Organization:** Dashboards are organized into **Groups (`spreadsheet.dashboard.group`)** (e.g., Sales, Finance, HR).
- **Presentation:** A `spreadsheet.dashboard` record is a wrapper that displays spreadsheet data in a read-only, full-page view in the Odoo backend.

### 2. Data Source & State
- **JSON State:** Like spreadsheets, the dashboard's grid, formulas, and visual formatting are stored as a JSON string in the `spreadsheet_data` field.
- **Static Snapshots:** Odoo often stores a `spreadsheet_snapshot` (binary) for faster rendering of the dashboard's "last known good" state.

### 3. UI & Grouping Workflow
- **Hierarchy:** Dashboard Group -> Dashboard. 
- **Mandate:** When configuring or moving dashboards, always ensure they are assigned to a logical `dashboard_group_id` to ensure they appear in the correct section of the Dashboard app sidebar.
- **Sequence:** Use the `sequence` field on both the Group and the Dashboard to control the display order in the UI.

### 4. Consumption Mandate
- **Read-Only:** Dashboards are designed for data consumption. If a user needs to modify formulas or perform ad-hoc analysis, the agent should direct them to the source `documents.document` (Spreadsheet) if applicable.

## Available Resources
- `dashboards-logic.md`: Deep-dive into Dashboard grouping, publishing states, and access control.
- `dashboards-fields.json`: Technical fields for Dashboard and Group models.
