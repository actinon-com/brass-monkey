# Odoo Human Resources Logic & Workflows

## The Organizational Chart
Odoo builds the org chart dynamically using the `parent_id` field on the Employee model.
- **Top-Down:** A manager can see all tasks, timesheets, and leave requests for their subordinates and their subordinates' subordinates (recursive access).
- **Department Managers:** If an employee has no direct `parent_id`, the `manager_id` of their `department_id` is considered their superior.

## Working Schedules (`resource.calendar`)
The schedule dictates the expected working hours (e.g., 40h/week, Mon-Fri).
- **Allocation:** Schedules are usually assigned via the **Contract**.
- **Timesheet/Attendance Gap:** Odoo compares actual hours (Attendance) vs. expected hours (Schedule) to calculate "Overtime".
- **Holidays:** Time Off requests are validated against the schedule to subtract only "Working Days".

## Onboarding Workflow
1. **System User:** Create the `res.users` record first to define the login and permissions.
2. **Employee:** Create the `hr.employee` and link it to the user.
3. **Contract:** Create the `hr.contract`. Note that some HR features (like the Employee Org Chart widget) may not show the employee as fully active until the contract is in the `open` (Running) state.

## Offboarding
- **Archiving:** When an employee leaves, set a `departure_date` and `departure_reason_id`. 
- **User Link:** The agent should check if the associated `res.users` record also needs to be deactivated (`active: false`) to prevent unauthorized system access.
