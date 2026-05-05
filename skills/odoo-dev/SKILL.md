---
name: odoo-dev
description: MANDATORY for customizations. High-level technical expertise in Odoo's customization engine, covering Server Actions, Automated Rules, and Odoo Studio modifications.
---
# Skill: Odoo Development & Customization

This skill provides the Gemini agent with high-level technical expertise in Odoo's customization engine, covering Server Actions, Automated Rules, and Odoo Studio modifications.

## Core Mandates

### 1. Snapshot Awareness (Technical Discovery)
- **Mandate:** The `dev-fields.json` resource is a **snapshot** of common technical models.
- **Verification:** If troubleshooting an error related to a custom module or a specific Odoo version, you **MUST** call `inspect_model` to retrieve the current, live schema. Custom fields added via Studio or third-party code will only be visible via live introspection.

### 2. Identify Customizations (Odoo Studio)
Before troubleshooting or proposing changes, the agent must identify existing low-code customizations:
- **Custom Fields:** Look for fields prefixed with `x_` (e.g., `x_studio_customer_type`).
- **Custom Models:** Look for technical models prefixed with `x_` (e.g., `x_service_agreement`).
- **Custom Views:** Studio modifications are stored in the database (`ir.ui.view`). Check for views with a name containing "studio" or an `inherit_id` pointing to a standard view.

### 2. Server Actions (`ir.actions.server`)
- **Purpose:** Execute Python code, update records, or trigger multi-step workflows via the UI.
- **Mandate:** When writing Python code in a Server Action, ensure all variables (`env`, `model`, `record`, `records`, `time`) are used correctly. Avoid long-running loops or operations that could cause database locks.
- **HTML Communication:** If using `message_post` within a Server Action to send HTML, remember to pass `body_is_html=True` to prevent escaping.

### 3. Automated Rules (`base.automation`)
- **Purpose:** Automatically trigger Server Actions based on specific events.
- **Triggers:**
    - `on_create`: When a record is first created.
    - `on_write`: When a record is updated (can be restricted to specific fields).
    - `on_time`: Based on a date field (e.g., 2 hours after a deadline).
- **Mandate:** Always check `filter_pre_domain` and `filter_domain` to understand exactly which records will trigger the rule.

### 4. Technical Troubleshooting Workflow
1. **Logs:** Check `ir.logging` for tracebacks or server-side error messages.
2. **Customizations:** Verify if an Automated Rule or a Studio field is causing the unexpected behavior.
3. **Environment:** Use the `env` variable in Server Actions to inspect related records or bypass access rights if absolutely necessary (using `sudo()`).

## Available Resources
- `dev-logic.md`: Deep-dive into Odoo's Python execution context, Studio mechanics, and module anatomy.
- `dev-fields.json`: Technical map for Server Action and Automation models.
