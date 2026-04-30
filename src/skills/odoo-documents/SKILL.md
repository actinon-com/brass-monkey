# Skill: Odoo Documents & Attachments

This skill provides the Gemini agent with functional expertise in Odoo's file management ecosystem, covering the foundational attachment layer and the advanced Document Management System (DMS).

## Core Mandates

### 1. Dual-Layer Architecture
Understand the distinction between the two layers of file management:
- **Base Attachments (`ir.attachment`):** Foundational binary storage. Linked to records via `res_model` and `res_id`. Use this for standard file storage on any record.
- **Managed Documents (`documents.document`):** The DMS layer. Provides workspaces, tags, and approval workflows.
- **Mandate (Odoo 18+):** In newer versions, folders and workspaces are unified into the `documents.document` model. Check the `type` field ('binary', 'url', or 'folder').

### 2. Workspace & Folder Organization
- **Hierarchy:** Managed via `folder_id` (pointing to another `documents.document` in Odoo 18+).
- **Mandate:** When creating or moving documents, always ensure they are assigned to the correct parent folder to maintain system-wide organization.

### 3. Workflows & Approvals
- **Validation:** Use Odoo Activities (`mail.activity`) linked via `request_activity_id` to manage internal approval requests (e.g., "Validate this Vendor Bill").
- **External Signatures:** Documents requiring external signatures typically link to the Odoo Sign app.
- **Mandate:** Do not bypass validation steps. If a document has a pending approval activity, the agent must acknowledge it before executing further state changes.

### 4. Sharing & Permissions
- **Internal Access:** Controlled via `access_internal` (view, edit, none) on the document.
- **Granular Sharing:** Managed via the `documents.access` model, linking specific Documents to specific Partners.
- **Public Links:** Controlled via `access_via_link` and `document_token`.

## Available Resources
- `documents-logic.md`: Deep-dive into Odoo 18 architectural changes, OCR/Action workflows, and attachment linking logic.
- `documents-fields.json`: Dense technical map of fields for Document, Attachment, Folder, and Access models.
