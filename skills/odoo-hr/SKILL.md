---
name: odoo-hr
description: Functional expertise in Odoo's HR module, covering Employee management, Departmental structures, and Employment contracts.
---
# Skill: Odoo Human Resources (HR)

This skill provides the Gemini agent with functional expertise in Odoo's HR module, covering Employee management, Departmental structures, and Employment contracts.

## Core Mandates

### 1. The Internal Identity (The Holy Trinity)
In Odoo, an internal person is represented by three linked records:
- **Employee (`hr.employee`):** The operational record (Manager, Department, Job).
- **User (`res.users`):** The system access record (Login, Permissions).
- **Partner (`res.partner`):** The communication record (Email, Phone, Address).
- **Mandate:** When creating an employee, always verify if a `res.users` record already exists to ensure proper linking.

### 2. Organizational Hierarchy
- **Reporting:** Every employee has a **Manager (`parent_id`)**. This field dictates the approval flow for Timesheets, Time Off, and Expenses.
- **Departments:** Employees are grouped into **Departments (`hr.department`)**. Departments can be nested (e.g., "R&D / Software").

### 3. Contracts & Compliance
- **Contract (`hr.contract`):** The legal anchor. Dictates the **Wage**, **Working Schedule**, and **Start/End Dates**.
- **States:** `draft` (New) -> `open` (Running) -> `close` (Expired).
- **Mandate:** An employee must have a `running` contract for many Odoo features (like Payroll or specific Attendance rules) to function correctly.

### 4. Search Workflow
1. **Locate:** Search `hr.employee` by `name` or `work_email`.
2. **Structure:** Check `parent_id` and `department_id` to understand the employee's place in the org chart.
3. **Status:** Verify the `attendance_state` (if Attendance is used) and the `contract_id` status.

## Available Resources
- `hr-logic.md`: Deep-dive into Working Schedules, Org Chart behavior, and Onboarding/Offboarding workflows.
- `hr-fields.json`: Dense technical map of fields for Employee, Department, Job, and Contract models.
