# Odoo Technical & Studio Logic

## Python Context in Server Actions
Odoo provides a pre-defined execution context when running Python code in `ir.actions.server`.

### Key Variables
- `env`: The Odoo Environment. Use this to access other models (e.g., `env['res.partner']`).
- `model`: The model recordset on which the action is running.
- `record`: The specific record on which the action is running (if triggered from a form view).
- `records`: The recordset being processed (if triggered from a list view).
- `user`: The current user.
- `time`, `datetime`, `dateutil`: standard Python utilities for date manipulation.

### Best Practices
- **`sudo()`:** Use sparingly to bypass access rules for specific operations.
- **`invalidate_cache()`:** Required if you perform direct SQL queries that modify the database.

## Odoo Studio Mechanics
Studio is Odoo's "database-only" development tool.
- **Model Modifications:** Adding a field via Studio creates an `ir.model.fields` record. This field is stored in the database but does not exist in the Python source code of any module.
- **Inheritance:** Studio modifies views by creating a new `ir.ui.view` record that sets the `inherit_id` to the original view and uses XPath to inject modifications.
- **Agent Role:** When the agent "reads" a view via `get_view`, Odoo's engine automatically combines the base XML with all Studio modifications. The agent should be aware that the `arch` it sees is the *computed* result.

## Module Anatomy
If the agent has access to the filesystem, it should look for logic in these locations:
- `models/`: Python files defining the ORM models and business logic.
- `views/`: XML files defining the UI (Forms, Lists, Kanbans).
- `static/src/`: JavaScript (OWL) and CSS/SCSS files for frontend behavior.
- `data/`: XML/CSV files used for initial configuration or demonstration data.

## System Logging (`ir.logging`)
Odoo stores server-side logs in the database.
- **Fields:** `message` (The log text), `path` (the Python file), `func` (the method name).
- **Mandate:** The agent should use `search_read` on `ir.logging` to find technical details for errors that occur during background tasks (like Cron jobs or Automated Rules).
