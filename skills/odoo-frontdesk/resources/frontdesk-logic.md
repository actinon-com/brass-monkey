# Odoo Frontdesk Logic & Reception Workflows

## Notification Routing
Odoo can alert hosts through multiple channels simultaneously upon visitor arrival.
- **Discuss:** Sends an internal message to the host's Odoo inbox. Highly recommended for active office staff.
- **Email:** Uses the `mail_template_id` set on the station. 
- **SMS:** Uses the `sms_template_id` for immediate alerts if the host is away from their desk.
- **Mandate:** The agent should check the `notify_discuss`, `notify_email`, and `notify_sms` flags on the `frontdesk.frontdesk` record to understand how alerts will be sent.

## Station Requirements
Each reception point can have custom rules for data collection:
- **Mandatory Fields:** Check `ask_company`, `ask_email`, and `ask_phone` settings. They can be `required`, `optional`, or `none`.
- **NDAs & Forms:** If `authenticate_guest` is enabled, the visitor may need to verify their identity or sign a document during check-in.
- **Self Check-In:** If `self_check_in` is enabled, Odoo displays a QR code allowing visitors to check in using their own mobile device.

## Pre-Registration & Appointments
- **Planned State:** You can create a visitor record in the `planned` state before they arrive. This is useful for pre-filling their details and assigning a host in advance.
- **Search upon Arrival:** When a guest arrives, the receptionist (or agent) should search for `planned` visitors by name first.

## Security & Safety
- **Presence Log:** The list of `checked_in` visitors provides a critical record of everyone in the building.
- **Archiving:** Past visitors can be archived, but their history remains linked to the `res.partner` and `hr.employee` (Host) records for audit purposes.
