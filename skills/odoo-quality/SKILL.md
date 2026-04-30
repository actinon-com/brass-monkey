---
name: odoo-quality
description: Functional expertise in Odoo's Quality Management system, covering Control Points, Quality Checks, and Quality Alerts.
---
# Skill: Odoo Quality & Compliance

This skill provides the Gemini agent with high-level functional expertise in Odoo's Quality Management system, covering Control Points, Quality Checks, and Quality Alerts.

## Core Mandates

### 1. The Quality Hierarchy
- **Quality Control Point (`quality.point`):** The "Rule" or "Trigger". It defines when and where a check should occur (e.g., during Receipt, Manufacturing, or Delivery).
- **Quality Check (`quality.check`):** The "Execution". A specific instance of a check triggered by a Control Point.
- **Quality Alert (`quality.alert`):** The "Failure/Exception". Created when a check fails or a non-conformance is spotted manually.

### 2. Workflow Gating
- **Mandate:** Quality checks are often "blocking" operations.
- **Inventory:** If a `stock.picking` has pending `quality.check` records, the picking cannot be validated until all checks are in the `pass` state.
- **Manufacturing:** If an `mrp.production` or `mrp.workorder` has pending checks, the operation cannot be finished until they are passed.

### 3. Check Types & Measurements
Understand the different ways quality is verified:
- **Pass/Fail:** Simple boolean verification.
- **Measure:** A numerical value that Odoo validates against `tolerance_min` and `tolerance_max` defined on the Point.
- **Worksheet:** A digital form (`worksheet.template`) that must be completed and often signed.

### 4. Alert Workflow (CAPA)
- **Corrective Action:** Immediate steps taken to fix the specific issue.
- **Preventative Action:** Long-term steps taken to prevent recurrence.
- **Mandate:** When creating or managing a `quality.alert`, the agent must populate the `action_corrective` and `action_preventive` fields if a root cause is identified.

## Available Resources
- `quality-logic.md`: Deep-dive into Control Point triggers, Frequency types, and Worksheet integration.
- `quality-fields.json`: Dense technical map of fields for Point, Check, and Alert models.
