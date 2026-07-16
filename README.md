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
- **Layered Credential Security:** API keys are supplied by your host's env-var secret mechanism, or persisted to an AES-256-GCM encrypted local file; when the OS keychain (Windows Credential Vault, macOS Keychain, libsecret) is available it is used automatically as an enhancement.
- **Audit & Reversibility:** Every write operation captures a "Before Snapshot" and logs a mandatory justification to Odoo's `ir.logging` and the record's Chatter.
- **30 Domain Skills:** Deep functional expertise pre-loaded for Sales, MRP, Finance, HR, and more.

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

Upgrade to a newer release with:

```bash
gemini extensions update brass-monkey
```

### 3. Install on Claude Code (plugin + marketplace)

Brass-Monkey is a self-serve Claude Code plugin. Add the marketplace, then install:

```shell
/plugin marketplace add actinon-com/brass-monkey
/plugin install brass-monkey@odoo-actinon
```

On install, Claude Code prompts for your Odoo **URL, database, username, and API
key** (the key is stored via Claude Code's secure storage). These are injected
into the server automatically — no further setup needed. Leave them blank to skip
straight to the `setup_instance` tool instead (see Path B below).

Upgrade to a new release with:

```shell
/plugin update brass-monkey@odoo-actinon
```

Skills are namespaced under the plugin, e.g. `/brass-monkey:odoo-sales`.

### 4. Install on Claude Desktop (`.mcpb` bundle)

For non-CLI users, Brass-Monkey also ships as a one-click Claude Desktop bundle
(`.mcpb`, the successor to the `.dxt` format).

1. Download `brass-monkey.mcpb` from the
   [latest release](https://github.com/actinon-com/brass-monkey/releases).
2. Install it — double-click, drag it into the Claude Desktop window, or
   **Settings → Extensions → Advanced settings → Install Extension…**.
3. In the install dialog, fill your Odoo **URL, database, username, and API key**
   (the key is masked and stored in your OS secure storage). Leave the fields
   blank to configure later via the `setup_instance` tool.

Upgrade by installing a newer `.mcpb` over the old one.

> **Note — skills:** the `.mcpb` bundle delivers the Odoo MCP **tools** only. The
> 30 domain skills are a Claude Code feature and ship with the plugin (section 3),
> not the desktop bundle. For the full tools-plus-skills experience, use Claude
> Code.

### 5. Configuration on Claude Code / generic MCP hosts

The server is host-agnostic: it never depends on Gemini's interactive prompts. Any
MCP host can configure it through **either** of two independent paths. (On the
Claude Code plugin and Claude Desktop bundle above, Path A is wired to the
install-time prompts for you.)

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
the API key (see **Credential storage** below), and persists non-secret metadata.
Use it to add further instances alongside an env-injected default, too.

Both paths work with no Gemini-specific step. The `mcp_config.json` template (below)
plus the `ODOO_*` variables is all a raw MCP host needs.

### ⬆️ Upgrading

Each surface upgrades independently, all to the same server version:

| Platform | Upgrade command |
| :--- | :--- |
| **Gemini CLI** | `gemini extensions update brass-monkey` |
| **Claude Code** | `/plugin update brass-monkey@odoo-actinon` |
| **Claude Desktop** | Download the newer `brass-monkey.mcpb` from the [latest release](https://github.com/actinon-com/brass-monkey/releases) and install it over the old one. |

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

### Credential storage

Keys are resolved in this order: **OS keychain → encrypted local file → environment variable.**

- **Environment variable** (`ODOO_API_KEY`) — the primary path for Claude Desktop /
  Claude Code and any host that manages secrets for you. Nothing is written to disk.
- **Encrypted local file** — the guaranteed cross-platform baseline for the
  `setup_instance` path, at `~/.gemini/brass-monkey/credentials.json` (mode `0600`).
  Values are encrypted with **AES-256-GCM** using a key derived from the current OS
  user and machine. This is *obfuscation-grade*: it protects against casual disk
  reads, backups, and file sync, but **not** against an attacker already running as
  your user (who can re-derive the same key). Legacy plaintext files from older
  versions are read transparently and re-encrypted on the next save.
- **OS keychain** (Windows Credential Vault, macOS Keychain, Linux libsecret) — used
  automatically as a best-effort *enhancement* when the native `keytar` module loads.
  Because `keytar` is a native binary that cannot be shipped for every OS in a single
  bundle, it is treated as optional; the encrypted file above is the reliable baseline.

Set `BRASS_MONKEY_NO_KEYCHAIN=1` to skip the native keychain and force the pure-JS
encrypted-file path (useful on headless CI or in sandboxes).

## 📄 License

This project is licensed under the MIT License.
