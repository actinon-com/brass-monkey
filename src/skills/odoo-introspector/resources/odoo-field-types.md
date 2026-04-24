# Odoo Field Types Reference

This guide explains the behavior and constraints of Odoo's primary relational and specialized field types.

## Relational Fields

### Many2one (`many2one`)
- **Behavior:** A link to a single record in another model (a foreign key).
- **Tool Output:** Includes `relation` (the target model).
- **Usage:** In tool calls, provide the integer ID of the target record.

### One2many (`one2many`)
- **Behavior:** A virtual relation representing the "many" side of a Many2one.
- **Tool Output:** Includes `relation` (the target model) and `relation_field` (the Many2one field on the target model that points back here).
- **Usage:** These fields are typically read-only or managed via special commands (e.g., `(0, 0, {values})` to create a new line).

### Many2many (`many2many`)
- **Behavior:** A bidirectional relation where many records link to many other records.
- **Tool Output:** Includes `relation` (the target model).
- **Usage:** Managed via command lists (e.g., `(4, id)` to link an existing record).

## Specialized Fields

### Compute Fields
- **Behavior:** Values calculated dynamically by a Python method.
- **Logic:** Check if the `not-stored` property is present.
- **Constraint:** `not-stored` compute fields cannot be used in `search` domains unless the Odoo server has explicitly implemented a search function for them.

### Selection Fields
- **Behavior:** A fixed list of valid string options.
- **Tool Output:** Includes `selection`, an array of `[value, label]` tuples.
- **Usage:** Only the `value` (the first element) should be used in tool calls.
