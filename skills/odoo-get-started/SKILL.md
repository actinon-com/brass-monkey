---
name: odoo-get-started
description: Orientation skill to establish context immediately upon connecting to an Odoo instance.
---
# Skill: Odoo Orientation (The Mandatory Start)

This skill ensures the Gemini agent establishes a comprehensive "World Map" of the Odoo environment immediately upon session start or when switching instances. **Bypassing this step is a violation of project architecture.**

## Core Mandates

### 1. The "World Map" Protocol (NON-NEGOTIABLE)
- **Mandate:** Your ABSOLUTE FIRST action when starting a task in a new or unknown Odoo instance **MUST** be to call `get_environment`.
- **Enforcement:** Do NOT attempt `search_read`, `list_models`, or any business logic until `get_environment` has returned.
- **Reasoning:** Odoo environments vary wildly by version, installed apps, and company structures. Starting "blind" leads to "hallucinated" field names and inefficient tool-chaining.

### 2. Interpreting the Environment
When you receive the `get_environment` response, you must internalize:
- **Version:** Are you on Odoo v18 (current) or an older legacy version? (Methods and fields change between versions).
- **User Context:** What is your name and login? (Used for audit trails).
- **Organization:** How many companies exist? Which one is active? What are the local currencies and languages?
- **Apps Manifest:** (If `show_manifest: true`) What modules are installed? (e.g., if `crm` is not installed, do not attempt to search for leads).

### 3. Progressive Disclosure
- **Basic Context:** Run `get_environment()` for standard tasks.
- **Security Context:** If the task involves permissions or access troubleshooting, run `get_environment(show_security: true)`.
- **Capability Context:** If you are unsure what business processes are supported, run `get_environment(show_manifest: true)`.

## Workflow Example
1. **Connect:** User asks to create a sale order.
2. **Orient:** Call `get_environment()`.
3. **Analyze:** "I am logged in as 'Admin' on Odoo v18. 'Sale Management' is installed. Active company is 'MyCompany' (USD)."
4. **Execute:** Proceed with `search_read` or `inspect_model` with confidence.
