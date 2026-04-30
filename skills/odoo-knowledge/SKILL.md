---
name: odoo-knowledge
description: Functional expertise in Odoo's Knowledge application, covering article creation, hierarchical organization, and collaborative sharing.
---
# Skill: Odoo Knowledge Management

This skill provides the Gemini agent with functional expertise in Odoo's Knowledge application, covering article creation, hierarchical organization, and collaborative sharing.

## Core Mandates

### 1. Hierarchical Architecture
- **Structure:** Articles are recursive. Use `parent_id` to build a navigation tree (e.g., "Engineering" -> "Procedures" -> "Safety").
- **Root Articles:** Articles without a `parent_id` act as the main categories in the sidebar.

### 2. Content & Formatting
- **Body:** The `body` field of a `knowledge.article` stores the content in **HTML**.
- **Mandate:** When creating or updating articles, the agent must ensure the generated HTML is clean and semantically correct (using `<h1>`, `<ul>`, `<table>`, etc.).

### 3. Sharing & Access Control
- **Categories:**
    - `workspace`: Visible to everyone with access to the Knowledge app.
    - `private`: Visible only to the owner unless explicitly shared.
    - `shared`: Articles that have been moved out of Private but aren't yet in the global Workspace.
- **Permissions:** Odoo uses `internal_permission` (write, read, none) for the general staff and `article_member_ids` (`knowledge.article.member`) for specific user overrides.
- **Public Sharing:** Use the `is_published` field to make an article accessible via a public URL (if the `website_knowledge` module is installed).

### 4. Search & Organization
- **Workflow:** Use `search_read` on `knowledge.article` to find existing documentation before creating new SOPs to prevent duplication.
- **Visuals:** Use the `icon` (emoji) and `cover_image_id` fields to make articles easier for human users to identify.

## Available Resources
- `knowledge-logic.md`: Deep-dive into permission inheritance, embedded views, and public sharing workflows.
- `knowledge-fields.json`: Dense technical map of fields for Article and Member models.
