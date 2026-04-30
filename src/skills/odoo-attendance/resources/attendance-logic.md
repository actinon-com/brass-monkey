# Odoo Attendance Logic & Presence Tracking

## Overtime Calculation
Odoo's overtime engine compares the physically logged hours in `hr.attendance` against the contractual working hours defined in the `resource.calendar`.
- **Reference:** The `expected_hours` field on the attendance record is the source of truth for the contractual requirement for that specific day.
- **Approvals:** If `overtime_status` is `to_approve`, the extra hours will not be reflected in payroll or reporting until a manager validates them.

## Attendance vs. Timesheets
The agent must understand the functional difference between these two "Time" concepts:
- **Attendance (`hr.attendance`):** Presence tracking. "I clocked in at 8 AM and out at 5 PM."
- **Timesheets (`account.analytic.line`):** Productivity tracking. "I spent 4 hours on Task X and 4 hours on Task Y."
- **Gap Analysis:** High-level managers use Odoo's reporting to identify gaps between Attendance and Timesheets (e.g., an employee was present for 8 hours but only billed 6).

## Kiosk Mode & Authentication
- **PIN:** Stored in the `pin` field on `hr.employee`. Used by employees to clock in/out on a shared tablet.
- **Barcode:** Stored in the `barcode` field. Allows employees to use physical ID badges.
- **Security:** In some environments, Odoo captures the **IP Address** and **Browser** to ensure employees are clocking in from an approved network or location.

## IP and Location Tracking
- **Metadata:** Fields like `in_ip_address`, `in_latitude`, and `in_longitude` are captured if the user's device allows location sharing.
- **Mandate:** The agent should check these fields if there are disputes about where an employee was when they clocked in.
