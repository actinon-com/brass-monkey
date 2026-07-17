---
name: odoo-attendance
description: Functional expertise in Odoo's Attendance module, covering check-in/out logs, working hour verification, and overtime management.
---
# Skill: Odoo Attendance

This skill provides the agent with functional expertise in Odoo's Attendance module, covering check-in/out logs, working hour verification, and overtime management.

## Core Mandates

### 1. Attendance Lifecycle
- **Record (`hr.attendance`):** A simple log with a `check_in` and optional `check_out` datetime.
- **Open Sessions:** An employee can only have ONE record with an empty `check_out` at any time. This represents a currently "Checked In" status.
- **Mandate:** Always verify the `attendance_state` on the `hr.employee` record before attempting to create a new check-in or update a check-out.

### 2. Overtime & Verification
- **Worked Hours:** Automatically calculated as the difference between `check_in` and `check_out`.
- **Expected Hours:** Pulled from the employee's **Working Schedule** (`resource.calendar`) via their contract.
- **Overtime:** Calculated as `Worked Hours - Expected Hours`. The agent should check `overtime_status` to see if extra hours require manager approval.

### 3. Kiosk Mode & Security
- **Authentication:** In Kiosk mode, employees use a `pin` or `barcode` (on the `hr.employee` model) to authenticate.
- **Data Integrity:** Mandate that agents do not manually create overlapping attendance records, as this will break Odoo's internal hour reporting.

### 4. Search Workflow
1. **Status Check:** Search `hr.employee` to find the current `attendance_state`.
2. **Log Review:** Query `hr.attendance` filtered by `employee_id` and `check_in` date range.
3. **Overtime Audit:** Check the `total_overtime` computed field on the employee record for a historical summary.

## Available Resources
- `attendance-logic.md`: Deep-dive into Overtime calculations, Kiosk configuration, and Attendance vs. Timesheets.
- `attendance-fields.json`: Dense technical map of fields for Attendance and Employee presence.
