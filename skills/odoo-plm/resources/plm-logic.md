# Odoo PLM Logic & Engineering Workflows

## BoM Version Control
Odoo PLM ensures that your manufacturing "Recipes" are never modified without a history.

- **Current Version:** The BoM that is currently active and used by new Manufacturing Orders.
- **Proposed Version:** A draft BoM linked to an ECO. It is invisible to production until the ECO is applied.
- **Application:** When an ECO is applied, Odoo increments the `version` field on the master `mrp.bom` and moves the old technical structure to history.

## Effectivity Dates
- **ASAP:** The new BoM version becomes the standard immediately upon ECO application.
- **Date-Based:** The change is scheduled for a future `effectivity_date`. New MOs created *after* this date will use the new version.

## Conflict Resolution
- **Rebase:** If the master BoM was changed by another ECO while your current ECO was still in progress, you must "Rebase". This updates your proposed version with the latest changes from the master so you can resolve any overlaps.
- **Conflicts:** Explicitly flagged when two ECOs attempt to modify the same component line or operation.

## Integrated Document Management
PLM is often the hub for technical documentation.
- **Attachments:** Technical drawings (`PDF`, `CAD`) can be attached directly to an ECO.
- **ECO to Product:** Upon application, the agent should verify if new documents need to be moved to the `product.template` document folder.
