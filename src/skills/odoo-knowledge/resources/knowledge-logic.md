# Odoo Knowledge Logic & Sharing Workflows

## Permission Inheritance
Odoo Knowledge uses an inheritance model for access control.
- **Top-Down:** By default, an article inherits the permissions of its `parent_id`. 
- **Desynchronization:** If `is_desynchronized` is `true`, the article stops inheriting and defines its own unique access rules.
- **Mandate:** The agent should check `inherited_permission` to understand why a user might (or might not) have access to a specific sub-article.

## Advanced Sharing Mechanics
- **`internal_permission`:** Defines what the general company can do (Read, Write, or No Access).
- **`article_member_ids`:** Links to `knowledge.article.member` to give specific users higher or lower access than the company default.
- **Portal & Public:** If `is_published` is true, the article is visible on the frontend website. The agent can use this to maintain public-facing FAQs.

## Embedded Views & Records
Odoo Knowledge allows "live" data to be embedded within the HTML body.
- **View Blocks:** You can embed an Odoo List or Kanban view directly in an article.
- **Record Links:** Use the `/` command in the Odoo editor (represented as specific `data-` attributes in the HTML) to link to specific business records.
- **Mandate:** When the agent analyzes an article's `body`, it should be aware of these technical placeholders which may render as interactive widgets for human users.

## Versioning & Collaboration
- **Last Edition:** Odoo tracks `last_edition_uid` and `last_edition_date`. 
- **Conflict Management:** While Odoo handles real-time concurrent editing, the agent should always `read` the latest `write_date` before executing a `write_record` to ensure it doesn't overwrite a human user's very recent changes.
