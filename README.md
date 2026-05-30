# Brass-Monkey 🐒: Gemini CLI Extension for Odoo

**Status: ✅ RELEASE v1.5.0 STABLE**  
*Verified Compatibility: Odoo v15 through v18+ (Enterprise and Community).*

**Brass-Monkey** is a high-fidelity, secure, and cognitively optimized **Gemini CLI extension** and Model Context Protocol (MCP) bridge for **Odoo**. It enables AI agents to navigate Odoo's complex ERP/CRM architecture, manage multiple instances, and perform highly audited record operations with extreme context-window efficiency.

---

## 🌟 Key Features

- **The "Breadth vs. Depth" Search Paradigm:** Uses lightweight paginated searches (`search_records`) for record discovery, and structured detail-fetchers (`get_record` / `get_records`) to build 360-degree interactive "Record Dashboards" containing child rows, Chatter threads, and real-time security ACLs.
- **In-Memory Metadata Caching:** Accelerates default database queries to **0ms metadata latency** by caching model configurations locally and performing parallel, background warming of parent-model schemas.
- **Hierarchical "Local Neighborhood" Navigation:** Exposes Odoo's menus (`get_menu`) as pruned, recursive JSON trees that cleanly map ancestral breadcrumbs, direct children, and immediate folder siblings while pruning out 95% of unrelated system noise.
- **Self-Healing Action Resolution:** Dynamically inspects Odoo's base tables to auto-resolve action types (`get_action`), supporting window, server, client, and report actions natively with zero parameter crashes.
- **OS-Level Security:** API Keys are stored in your operating system's secure keychain (Windows Credential Vault, macOS Keychain).
- **Audit & Reversibility:** Every write operation captures a "Before Snapshot" and logs a mandatory justification to Odoo's `ir.logging` and the record's Chatter.
- **23 Domain Skills:** Deep functional expertise pre-loaded for Sales, MRP, Finance, HR, and more.

---

## 🚀 Quick Start

### 1. Installation
The recommended way to install **Brass-Monkey** is using the official Gemini CLI extension command. This will guide you through the interactive setup of your first Odoo instance.

```bash
gemini extensions install https://github.com/actinon-com/brass-monkey.git
```

### 2. Configuration
During installation, you will be prompted for:
- **Odoo Instance URL:** e.g., `https://my-company.odoo.com`
- **Database Name:** The name of your Odoo database.
- **Username / Email:** Your login credentials.
- **API Key / Password:** Your Odoo External API Key (recommended).

You can update these settings later or add additional instances using:

```bash
# Update existing default instance
gemini extensions config brass-monkey
```

---

## 🛠️ Available Tools

| Category | Tool | Description |
| :--- | :--- | :--- |
| **Discovery** | `list_models` | Search and list Odoo's technical models with pagination. |
| | `inspect_model` | Perform a deep architectural audit of any Odoo model's fields, modules, and rules. |
| **UX & Navigation** | `get_menu` | Retrieve recursive, pruned JSON trees of menus (hierarchical drilling or semantic search). |
| | `get_action` | Retrieve Window, Server, Client, or Report Action details with view-mode bindings. |
| | `get_view` | Retrieve raw XML/definitions for Odoo form, tree, or kanban views. |
| **Safe CRUD** | `search_records` | Search Odoo records, returning a lightweight breadcrumbs-envelope and list totals. |
| | `get_record` | Retrieve a 360-degree detailed dashboard of a single record, including lines and chatter. |
| | `get_records` | Retrieve deep, multi-line detailed reports for multiple records in batch. |
| | `create_record` | Create new records in a specified model with mandatory business justification. |
| | `write_record` | Update existing records with field-level snapshot tracking. |
| | `unlink_record` | Delete records from Odoo (highly audited). |
| | `aggregate_records`| Server-side grouping and pivot-style aggregations with custom offset pagination. |
| **Reports** | `list_reports` | List all available PDF reports (Invoices, Quotations, Packing Slips) for a model. |
| | `download_report` | Generate and retrieve PDF report data. |
| **Workspace** | `setup_instance` | Add and authenticate new Odoo environments. |
| | `list_instances` | List all configured environments. |
| | `switch_instance` | Change the active environment. |
| | `get_info` | Retrieve server version and configuration stats. |

---

## 💼 Domain Skills Catalog

Brass-Monkey includes specialized guidance for the following Odoo areas:

- **Foundation:** `relations` (Partners), `products`, `inventory`, `security`.
- **Sales:** `crm`, `sales`, `purchasing`, `website`, `helpdesk`.
- **Industrial:** `mrp` (Manufacturing), `plm` (Engineering).
- **Projects:** `projects`, `timesheets`, `field-service`.
- **Internal Ops:** `finance`, `hr`, `attendance`, `frontdesk`.
- **Content:** `knowledge`, `documents`, `worksheets`.
- **Intelligence:** `spreadsheets`, `dashboards`.

---

## 💻 Local Development & Isolated Testing

For developers working on this extension, you can run isolated tests against your live Odoo database without modifying your stable global installation.

1. Create a local `.env` file in the root of the workspace (ignored by git):
```env
ODOO_URL="https://my-company.odoo.com"
ODOO_DB="my-database"
ODOO_USERNAME="my-email@company.com"
ODOO_API_KEY="my-api-key"
```

2. Start the parallel MCP Inspectors using the helper script:
```bash
# Start all three inspectors (Production, Development, Python)
./start-inspectors.sh --all

# Start ONLY your local workspace development inspector (Port 6275, Proxy 6278)
./start-inspectors.sh --dev
```

---

## 🛡️ Security & Privacy

- **Zero Cleartext Policy:** API keys are never stored in your project folder or logged to the console.
- **Audit Trail:** All AI actions are attributed and logged within Odoo's `ir.logging` and record Chatter.
- **Production Guard:** Writing to Odoo requires an explicit business `justification`.

## 📄 License

This project is licensed under the MIT License.
