# Odoo Documents & Attachments Logic

## Odoo 18 Architectural Shift
In Odoo 18, the Documents application underwent a massive unification:
- **Unified Model:** The separate `documents.folder` model was merged into `documents.document`. A "Folder" is now just a Document with `type: 'folder'`.
- **Recursive Hierarchy:** This allows folders to have all the properties of documents (tags, activities, sharing) and enables infinitely nested structures via `folder_id`.
- **Mandate for Agent:** When navigating, the agent should search for `type: 'folder'` to map the workspace hierarchy and `type: 'binary'` or `type: 'url'` for actual content.

## Attachment Linking (`ir.attachment`)
- **Direct Linking:** Attachments are linked to specific records using `res_model` (e.g., `sale.order`) and `res_id` (the record ID).
- **DMS Link:** A `documents.document` record points to an `ir.attachment` via the `attachment_id` field.
- **Agent Role:** To retrieve the actual file content, the agent must read the `datas` (base64) or `raw` field from the linked `ir.attachment`.

## Workflow Actions & Approvals
The Documents app automates business processes through "Actions":
- **OCR (Optical Character Recognition):** Odoo can automatically extract data from PDFs to create Vendor Bills or Expenses. The agent should monitor the `handler` field for documents being processed by the system.
- **Requesting Validation:** An agent can trigger an approval workflow by creating a `mail.activity` linked to the document and assigning it to the appropriate manager.
- **Odoo Sign Integration:** For contracts, Odoo generates a signature request. The document's state will often transition based on the completion of the signature process.

## External Sharing & Access
- **`documents.access`:** This model manages who (Partners) can access a specific document and with what role (`view` vs `edit`).
- **Share Links:** Generating a share link creates an `access_token` and `document_token`. If `access_via_link` is set to `view` or `edit`, any person with the URL can access the document regardless of internal permissions.
- **Upload Links:** Folders can be shared with an "Upload" role, allowing external users to drop files directly into a specific Odoo Workspace.
