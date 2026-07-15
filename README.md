# Brass-Monkey 🐒: Gemini CLI Extension for Odoo

**Status: ✅ Stable**  
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

### 3. Configuration on Claude Code / generic MCP hosts

The server is host-agnostic: it never depends on Gemini's interactive prompts. Any
MCP host can configure it through **either** of two independent paths.

**Path A — host-injected environment variables.** Set the `ODOO_*` variables in your
host's server entry; on startup they populate a single default instance (no tool call
needed). This is the env-var contract:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `ODOO_ALIAS` | No (default `default`) | Alias for the injected instance. |
| `ODOO_URL` | Yes | Base URL, e.g. `https://my-company.odoo.com`. |
| `ODOO_DB` | Yes | Odoo database name. |
| `ODOO_USERNAME` | Yes | Login username or email. |
| `ODOO_API_KEY` | Yes | Odoo External API Key (recommended) or password. **Sensitive** — inject via your host's secret mechanism; never commit it. |

`ODOO_URL`, `ODOO_DB`, and `ODOO_USERNAME` must all be present for the instance to
register; `ODOO_API_KEY` is resolved for the instance named by `ODOO_ALIAS`.

**Path B — the `setup_instance` tool (first-run).** With no env vars set, call
`setup_instance` from the client. It validates the credentials against Odoo, stores
the API key in your OS keychain (`keytar`, with a `0600` local-file fallback), and
persists non-secret metadata. Use it to add further instances alongside an
env-injected default, too.

Both paths work with no Gemini-specific step. The `mcp_config.json` template (below)
plus the `ODOO_*` variables is all a raw MCP host needs.

---

## 🛠️ Available Tools

| Category | Tool | Description |
| :--- | :--- | :--- |
| **Discovery** | `list_models` | Search and list Odoo's technical models with pagination. |
| | `inspect_model` | Perform a deep architectural audit of any Odoo model's fields, modules, and rules. |
| | `get_environment` | "World Map" orientation — server, user, company, and app context. Recommended first call in a session. |
| **UX & Navigation** | `get_menu` | Retrieve recursive, pruned JSON trees of menus (hierarchical drilling or semantic search). |
| | `get_action` | Retrieve Window, Server, Client, or Report Action details with view-mode bindings. |
| | `get_view` | Retrieve raw XML/definitions for Odoo form, tree, or kanban views. |
| | `trace_ui_path` | Discover exactly how to reach a model through the UI (Menus → Actions → Views). |
| **Safe CRUD** | `search_records` | Search Odoo records, returning a lightweight breadcrumbs-envelope and list totals. |
| | `get_record` | Retrieve a 360-degree detailed dashboard of a single record, including lines and chatter. |
| | `get_records` | Retrieve deep, multi-line detailed reports for multiple records in batch. |
| | `create_record` | Create new records in a specified model with mandatory business justification. |
| | `write_record` | Update existing records with field-level snapshot tracking. |
| | `unlink_record` | Delete records from Odoo (highly audited). |
| | `aggregate_records`| Server-side grouping and pivot-style aggregations with custom offset pagination. |
| **Reports** | `list_reports` | List all available PDF reports (Invoices, Quotations, Packing Slips) for a model. |
| | `download_report` | Generate and retrieve PDF report data. |
| | `download_file` | Download any file or attachment from an Odoo database to the local workspace. |
| **Workspace** | `setup_instance` | Add and authenticate new Odoo environments. |
| | `list_instances` | List all configured environments. |
| | `switch_instance` | Change the active environment. |
| | `remove_instance` | Delete an instance configuration and its stored credentials. |
| | `get_info` | Retrieve server version and configuration stats. |
| | `get_audit_log` | Retrieve recent local audit log entries for transparency. |

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

> **Manual / standard MCP config:** `mcp_config.json` is a template for hosts that
> consume a raw MCP server entry (e.g. Antigravity, or `claude mcp add`). Replace the
> `cwd` placeholder `/ABSOLUTE/PATH/TO/brass-monkey` with the absolute path to your
> checkout. All hosts launch the same `node dist/bundle/index.js`.

---

## 🛡️ Security & Privacy

- **Zero Cleartext Policy:** API keys are never stored in your project folder or logged to the console.
- **Audit Trail:** All AI actions are attributed and logged within Odoo's `ir.logging` and record Chatter.
- **Production Guard:** Writing to Odoo requires an explicit business `justification`.

## 📄 License

This project is licensed under the MIT License.
