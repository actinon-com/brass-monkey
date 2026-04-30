# Odoo Website Logic & CMS Workflows

## The Page-to-View Relationship
A `website.page` record is essentially a wrapper around a QWeb `ir.ui.view`.
- **`view_id`:** The underlying technical XML that defines the layout.
- **`url`:** The public-facing endpoint (e.g., `/our-mission`).
- **Logic:** If you delete a `website.page`, Odoo often retains the `ir.ui.view` as an orphan. The agent should be aware that the actual "Content" lives in the View's `arch` field.

## Multi-Website Data Isolation
Odoo provides "Data Scoping" for various models:
- **Products:** A product can be restricted to `Website A` only.
- **Pricelists:** Customers on `Website B` can be forced to use a specific currency or pricing tier.
- **Payment Providers:** You can enable Stripe for `Website A` and PayPal for `Website B`.

## Menu Hierarchy Logic
- **`parent_id`:** Use this to create dropdown menus.
- **`sequence`:** Controls the left-to-right order in the header.
- **Active State:** Unchecking `active` on a menu hides it from the frontend without deleting the link.

## SEO Best Practices
- **Meta Title:** Should be < 60 characters.
- **Meta Description:** Should be < 160 characters.
- **Redirects:** If a `url` is changed on a `website.page`, Odoo usually handles the 301 redirect automatically, but the agent should verify the `website.rewrite` (or `website.redirect`) model if users report broken links.
