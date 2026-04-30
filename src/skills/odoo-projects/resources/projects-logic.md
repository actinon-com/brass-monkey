# Odoo Project Logic & Service Fulfillment

## Service Fulfillment Strategies
How a project relates to a Sales Order (SO) dictates how work is billed.

### 1. Fixed Price (Milestones)
- **Concept:** The customer is billed a fixed amount upon reaching specific goals.
- **Workflow:** When the technical team marks a `project.milestone` as `is_reached`, Odoo updates the `qty_delivered` on the SO line.
- **Agent Role:** Monitor milestone deadlines and ensure all prerequisite tasks are completed.

### 2. Time & Materials (T&M)
- **Concept:** The customer is billed for every hour recorded on the project.
- **Workflow:** Logging an `account.analytic.line` (Timesheet) against a task automatically increments the `qty_delivered` on the SO line.
- **Mandate:** Ensure the `employee_id` on the timesheet has a defined **Hourly Cost** to track project profitability accurately.

## Analytic Accounting for Projects
- **Profitability:** Odoo calculates project profitability by comparing:
    - **Revenues:** Invoiced amounts linked to the project's Analytic Account.
    - **Costs:** `Hours Worked * Employee Hourly Cost`.
- **Mandate:** The agent must understand that the Project's `account_id` is the anchor for all financial reporting related to the project.

## Stage Management
- **Stages (`project.task.type`):** Can be global or project-specific.
- **Rating:** Some stages are configured to automatically send a "Customer Rating" email when a task enters them.
- **Folded:** Tasks in "Folded" stages are generally considered "Closed" or "Archived" for reporting purposes.

## Sub-tasks & Dependencies
- **Parent/Child:** Used to break down large deliverables. The `total_hours_spent` on a parent task includes all time logged on its children.
- **Dependencies:** One task can "Block" another. The agent should check the `depend_on_ids` field before starting a task to ensure it is unblocked.
