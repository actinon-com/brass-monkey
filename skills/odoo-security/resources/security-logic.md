# Odoo Security & Permission Logic

## Access Rights (`ir.model.access`)
Access rights define model-level permissions for specific groups.
- **Granting:** If multiple groups have different access rights for the same model, Odoo grants the *highest* level of access.
- **Flags:** `perm_read`, `perm_write`, `perm_create`, `perm_unlink`.
- **Mandate:** If a user has no access rights defined for a model (either directly or via groups), they cannot perform any operation on that model.

## Record Rules (`ir.rule`)
Record rules enforce row-level security using Odoo Domain filters.
- **`domain_force`:** A Python-style domain (e.g., `[('user_id', '=', user.id)]`) that restricts record visibility.
- **Global Rules:** Rules without an assigned group are applied to all users. They are combined with an **AND** operator.
- **Group Rules:** Rules assigned to a specific group. Rules for the *same* group are combined with **OR**, while rules for *different* groups are combined with **AND**.
- **Dynamic Variables:** You can use `user` (current user record) and `company_ids` (allowed companies) inside the domain.

## Multi-Company Security
Odoo enforces data isolation in multi-company environments.
- **Rule Engine:** Most multi-company security is implemented via standard Record Rules on the `company_id` field.
- **Default Rule:** `['|', ('company_id', '=', false), ('company_id', 'in', company_ids)]`.
- **Linking Constraint:** If you try to link a record in Company A to a record in Company B, Odoo will throw a `ValidationError` during the `write` or `create` operation.

## Bypassing Security (`sudo()`)
In some technical or automated scenarios, you might need to bypass security.
- **`sudo()`:** Calls the method with the Superuser (ID 2) context.
- **Usage Mandate:** Only use `sudo()` in `ir.actions.server` or custom code when the operation is technically necessary and safe (e.g., updating a read-only log record). Never use it to expose sensitive business data to an unauthorized user.
