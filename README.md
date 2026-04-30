# Brass-Monkey 🐒

**Status: ⚠️ BETA RELEASE**  
*Verified Compatibility: Odoo v15 and v18. Other versions may work but have not been fully end-to-end tested.*

**Brass-Monkey** is a high-fidelity Gemini CLI extension that provides a secure, intelligent, and business-aware bridge to Odoo. It enables AI agents to navigate Odoo's complex ERP/CRM architecture, manage multiple instances, and perform safe, audited record operations.

## 🌟 Key Features

- **Multi-Instance Manager:** Manage Production, Staging, and Dev environments in one session.
- **OS-Level Security:** API Keys are stored in your operating system's secure keychain (Windows Credential Vault, macOS Keychain).
- **Audit & Reversibility:** Every write operation captures a "Before Snapshot" and logs a mandatory justification to the Odoo record's Chatter.
- **Version-Aware:** Automatically adapts to Odoo versions (v14 through v18+).
- **Forgiving Interface:** Advanced Zod schemas reduce "formatting chatter" by automatically handling type coercion and array wrapping.
- **23 Domain Skills:** Deep functional expertise pre-loaded for Sales, MRP, Finance, HR, and more.

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/brass-monkey.git
cd brass-monkey

# Install dependencies and build
npm install
npm run build
```

### 2. Configuration
Use the built-in setup tool to register your Odoo instances. We recommend using **Odoo External API Keys** for maximum security.

```json
setup_instance({
  "alias": "prod",
  "url": "https://my-company.anergy.com",
  "db": "my-database",
  "username": "admin@company.com",
  "api_key": "your-odoo-api-key"
})
```

## 🛠️ Available Tools

| Category | Tools |
| :--- | :--- |
| **Discovery** | `list_models`, `inspect_model` |
| **UX & Navigation** | `get_menu`, `get_action`, `get_view` |
| **Safe CRUD** | `search_read`, `create_record`, `write_record`, `unlink_record` |
| **Reports** | `list_reports`, `download_report` |
| **Workspace** | `setup_instance`, `list_instances`, `switch_instance` |

## 💼 Domain Skills Catalog

Brass-Monkey includes specialized guidance for the following Odoo areas:

- **Foundation:** `relations` (Partners), `products`, `inventory`, `security`.
- **Sales:** `crm`, `sales`, `purchasing`, `website`, `helpdesk`.
- **Industrial:** `mrp` (Manufacturing), `plm` (Engineering).
- **Projects:** `projects`, `timesheets`, `field-service`.
- **Internal Ops:** `finance`, `hr`, `attendance`, `frontdesk`.
- **Content:** `knowledge`, `documents`, `worksheets`.
- **Intelligence:** `spreadsheets`, `dashboards`.

## 🛡️ Security & Privacy

- **Zero Cleartext Policy:** API keys are never stored in your project folder or logged to the console.
- **Audit Trail:** All AI actions are attributed and logged within Odoo's `ir.logging` and record Chatter.
- **Production Guard:** Writing to Odoo requires an explicit business `justification`.

## 💡 Troubleshooting Tip

**Snapshot Awareness:** Static field maps in skills are "convenience snapshots." If you have custom Studio fields or a unique Odoo configuration, simply tell the agent to **"Inspect the model again"** to refresh its live technical knowledge.

## 📄 License

This project is licensed under the MIT License.
