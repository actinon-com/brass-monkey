# Skill: Odoo Frontdesk

This skill provides the Gemini agent with functional expertise in Odoo's Frontdesk application, covering visitor management, reception check-ins, and host notifications.

## Core Mandates

### 1. Visitor Lifecycle
- **States:** `planned` (Upcoming appointment) -> `checked_in` (Visitor is on-site) -> `checked_out` (Visitor has left).
- **Check-In:** When a visitor arrives, update their state and capture the `check_in` time.
- **Check-Out:** Recording the `check_out` time is mandatory for accurate fire-safety and presence logs.

### 2. Host & Notifications
- **The Host (`host_ids`):** Every visitor is usually seeing one or more Employees.
- **Notifications:** Upon check-in, Odoo can automatically notify the host via **Discuss**, **Email**, or **SMS** based on the Station configuration.
- **Mandate:** Always verify the `host_ids` are set to ensure the correct internal staff are alerted.

### 3. Stations & Kiosks
- **Station (`frontdesk.frontdesk`):** Represents a physical reception point or tablet.
- **Configuration:** Stations dictate what information is required (e.g., Company, Phone, Email) and whether drinks are offered.

### 4. Search & Data Integrity
- **Verification:** Before creating a new visitor, search for an existing `res.partner` using name or email. Linking to a partner record provides a richer history of interactions.
- **Duplicate Prevention:** Avoid creating multiple visitor records for the same planned appointment.

## Available Resources
- `frontdesk-logic.md`: Deep-dive into Notification routing, Station settings, and Pre-Registration.
- `frontdesk-fields.json`: Dense technical map of fields for Visitor and Frontdesk models.
