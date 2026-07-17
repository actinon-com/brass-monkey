---
name: odoo-website
description: Functional expertise in Odoo's CMS, covering Page creation, Navigation management, and Multi-Website architecture.
---
# Skill: Odoo Website & CMS Management

This skill provides the agent with high-level functional expertise in Odoo's CMS (Content Management System), covering Page creation, Navigation management, and Multi-Website architecture.

## Core Mandates

### 1. Multi-Website Architecture
Odoo can power multiple distinct domains from a single database.
- **Scoping:** ALWAYS respect the `website_id` field. Content without a `website_id` is considered "Global" and visible on all domains.
- **Isolation:** When creating pages or menus, ensure they are linked to the correct `website_id` to prevent data leaking between brands/domains.

### 2. CMS Content Lifecycle
- **Pages (`website.page`):** Represent specific public URLs.
- **Publishing:** The `is_published` field controls visibility to the public. 
- **Mandate:** Always verify the `url` is unique within the scope of the target `website_id`.

### 3. Navigation Hierarchy
- **Menus (`website.menu`):** Define the header and footer links.
- **Structure:** Menus are recursive (`parent_id`). 
- **Linking:** A menu can point to a `url` or a specific `page_id`.

### 4. SEO & Metadata
- **SEO Optimization:** Use `website_meta_title`, `website_meta_description`, and `website_meta_keywords` to improve search engine rankings.
- **Social Sharing:** Manage the OpenGraph image (`website_meta_og_img`) to control how pages look when shared on social media.

## Available Resources
- `website-logic.md`: Deep-dive into Multi-Website data isolation and the Page-to-View relationship.
- `website-fields.json`: Dense technical map of fields for Website, Page, and Menu models.
