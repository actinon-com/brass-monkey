---
name: odoo-projects
description: MANDATORY for Projects (project.project) and Tasks (project.task). Expertise in Odoo's project management and milestone tracking.
---
# Skill: Odoo Projects, Milestones & Timesheets

This skill provides the agent with high-level functional expertise in Odoo's Project Management engine, covering Tasks, Milestones, and the critical integration with Sales (Invoicing) and Accounting (Analytic Ledger).

## Core Mandates

### 1. Project Hierarchy
- **Project (`project.project`):** The top-level container. Dictates whether Timesheets and Milestones are enabled.
- **Task (`project.task`):** The unit of work. Progresses through Kanban **Stages (`project.task.type`)**.
- **Sub-tasks:** Tasks can have a `parent_id`, allowing for multi-level work breakdown.

### 2. Milestone Billing
- **Milestones (`project.milestone`):** Used to track major project achievements.
- **Invoicing Link:** When a milestone is marked as `is_reached`, Odoo can automatically update the `qty_delivered` on the linked `sale_line_id`, allowing the Sales Order to be invoiced.
- **Mandate:** Always check if a task is linked to a Milestone before marking it as done, as it may have financial implications.

### 3. Timesheet Management
- **Logging Time:** Actual work is recorded in **Analytic Lines (`account.analytic.line`)**, commonly referred to as Timesheets.
- **Billing Types:**
    - **Billable (T&M):** Time logged directly updates the "Delivered Quantity" on the Sales Order.
    - **Fixed Price:** Time is logged for cost tracking, but does not affect the invoiced amount.
    - **Non-billable:** Time is tracked purely for internal project management.

### 4. Sales & Accounting Integration
- **Sales Order Link:** Tasks and Timesheets are typically linked to a `sale_line_id`. This is the "Contract" that defines the billing rate.
- **Analytic Accounting:** Every project is linked to an **Analytic Account (`account_id`)**. This account aggregates all costs (Timesheets) and revenues (Invoices) for financial reporting.

## Available Resources
- `projects-logic.md`: Deep-dive into Service Fulfillment strategies, Analytic costing, and Stage management.
- `projects-fields.json`: Dense technical map of fields for Project, Task, Milestone, and Timesheet models.
