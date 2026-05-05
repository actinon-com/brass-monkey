---
name: odoo-ux
description: MANDATORY for UI navigation. Expertise in Odoo's interface architecture (Menus, Actions, Views) and frontend metadata.
---
# Skill: Odoo UX & Navigation

This skill provides the Gemini agent with the necessary expertise to navigate Odoo's user interface architecture and interpret frontend metadata.

## Core Mandates

### 1. Navigation Flow
Odoo's UI is strictly hierarchical. When a user interacts with the system, the following flow occurs:
1. **Menu (`ir.ui.menu`):** The user clicks a menu item.
2. **Action (`ir.actions.act_window`):** The menu triggers an action that defines the target business model (e.g., `sale.order`) and the default view modes (e.g., `tree,form`).
3. **View (`ir.ui.view`):** The action opens a specific view (Form, Tree/List, Kanban) representing the model's data.

### 2. Interpreting View XML
Odoo views are defined in XML (`arch`). When reading an architecture, look for these logical groupings:
- `<notebook>` & `<page>`: Horizontal tabs used to categorize fields (e.g., "Order Lines", "Other Information").
- `<group>`: A logical container that typically renders in two columns.
- `<field>`: A specific data entry point. Look for `attrs` (invisible, readonly, required) for dynamic behavior.
- `<button>`: Triggers a server-side method (e.g., `action_confirm`) or another UI action.

### 3. Filters & Defaults
- **Domain:** A filter applied by the Action to restrict the records shown (e.g., `[('state', '=', 'sale')]`).
- **Context:** Used to set default values for new records or toggle UI features (e.g., `{'default_type': 'out_invoice'}`).

## Available Resources
- `qweb-basics.md`: Reference for Odoo's XML templating directives.
- `owl-basics.md`: Reference for the Odoo Web Library (OWL) components.
