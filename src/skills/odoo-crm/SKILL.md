# Skill: Odoo CRM & Pipeline Management

This skill provides the Gemini agent with high-level functional expertise in Odoo's CRM engine, covering Lead qualification, Opportunity management, and Activity tracking.

## Core Mandates

### 1. The Unified Model (`crm.lead`)
Odoo uses a single model to represent the entire pre-sales lifecycle.
- **Leads:** Unqualified contacts. Set `type: 'lead'`. Typically have no linked `partner_id`.
- **Opportunities:** Qualified deals. Set `type: 'opportunity'`. MUST be linked to a `partner_id`.

### 2. Pipeline Stages
The Kanban pipeline is defined by **Stages (`crm.stage`)**.
- **Stage Movement:** Updating `stage_id` often triggers an automatic update to the `probability`.
- **Won/Lost:** Marking a lead as Won sets `probability: 100.0`. Marking as Lost requires a `lost_reason_id`.

### 3. Conversion Policy
When transitioning a Lead to an Opportunity:
- **Duplicate Prevention:** ALWAYS search for existing `res.partner` records by email or phone before creating a new one.
- **Linking:** If a match is found, link the existing partner to the opportunity.

### 4. Activity-Driven Workflow
Use **Activities (`mail.activity`)** to schedule follow-ups.
- **Mandate:** Every active opportunity should have at least one upcoming activity.
- **Tracking:** Use the `my_activity_date_deadline` field to prioritize your attention.

## Available Resources
- `crm-logic.md`: Deep-dive into Lead generation, Probabilities, and Won/Lost workflows.
- `crm-fields.json`: Dense technical map of fields for Lead, Stage, Team, and Lost Reason models.
