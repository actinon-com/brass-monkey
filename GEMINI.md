# Brass-Monkey (Gemini CLI Extension for Odoo)

## Project Mandate
Brass-Monkey replaces **Brass-Compass**, a prototype Python MCP server, with a modern, secure, and intelligent Node.js bridge for Odoo. It provides AI agents with a high-fidelity interface to Odoo's CRM, ERP, and business logic layers.

> **Source Reference:** Original Python implementation: [brass-compass](https://github.com/actinon-com/brass-compass.git)

### Core Objectives:
- **Platform Port:** Transition from Python/MCP to Node.js/JavaScript (TypeScript).
- **Structure:** Align with the [gemini-cli-extensions/workspace](https://github.com/gemini-cli-extensions/workspace) pattern.
- **Enhanced Auth:** Support native Odoo login and Google OAuth2.
- **Smarter Output:** Optimize data density for LLM context efficiency.
- **Skill-Centric:** Leverage Gemini CLI skills to provide domain-specific expertise and procedural guidance.

## Technical Mandate
- **Language:** TypeScript (Strict Mode).
- **Module System:** ES Modules (ESM).
- **Validation:** Use `zod` for all tool parameter schemas and Odoo response validation.
- **Performance:** Asynchronous operations for all RPC calls.
- **Testing:** Comprehensive test suite for tool execution and skill logic.

## Project Architecture
Aligning with the Gemini CLI extension model:
- `src/tools/`: Implementation of Odoo-bridge tools (RPC wrappers, metadata discovery).
- `src/skills/`: Domain-specific instructions and resource definitions.
- `src/services/`: Core logic for Odoo connectivity and authentication.
- `src/schemas/`: Zod schemas for Odoo models and tool parameters.
- `docs/`: Technical documentation and implementation guides.

## Authentication Strategy
Brass-Monkey must support a flexible, multi-layered authentication flow:
1. **Odoo Native:** Support for Odoo Session ID and API Keys.
2. **Google OAuth2:** Seamless login for Odoo environments integrated with Google Workspace.
3. **Identity Provider (IdP):** Extensible architecture for future SSO integrations.

## Security & Data Protection
- **Zero-Log Policy:** Never log Odoo session tokens, passwords, or sensitive record data.
- **Credential Isolation:** Use environment variables or secure local keychains; never commit secrets.
- **Write Guards:** Implementation of a 'Production Guard' to prevent accidental writes to live instances without explicit justification.

## Implementation Roadmap
- **Phase 1: Foundation.** Port the Odoo XML-RPC/JSON-RPC bridge to TypeScript.
- **Phase 2: Discovery.** Implement tools for `list_models`, `inspect_model`, and `get_view`.
- **Phase 3: Core CRUD.** Implement high-fidelity record search, read, write, and unlink tools.
- **Phase 4: Domain Skills.** Deploy skills for Sales, Invoicing, Inventory, and CRM.

## Skills Framework

Skills are categorized into two primary layers:

### 1. Interface & Structural Skills
Assist the agent in navigating Odoo's complex architecture:
- **Odoo-UX:** Best practices for exploring views, menus, and window actions.
- **Data-Ops:** Optimized patterns for batch reading, complex domains, and relationship resolution.
- **Dev-Best-Practices:** Guidance on Odoo's ORM logic and execution points.

### 2. Domain Knowledge Skills
Assist the agent in performing business tasks within Odoo:
- **Sales:** Sales orders, quotations, and pipeline management.
- **Finance:** Invoicing, customers, vendors, and payments.
- **Logistics:** Inventory, products, variants, and shipping.
- **Relations:** Contacts, partner management, and lead generation.

## Audit & Reversibility
Brass-Monkey must ensure all state-changing operations are transparently recorded and reversible within the Odoo environment.

- **System Logging:** Use Odoo's `ir.logging` to record high-level tool execution, including the agent's identity and timestamp.
- **Activity Chatter:** For models that support it, state-changing operations (`create`, `write`, `unlink`) must post a message to the record's **Chatter** (`mail.message`).
- **Reversibility Context:** Logs must contain sufficient information—such as snapshots of modified fields or specific state transitions—to enable either an Agent or a human User to determine how to accurately undo the changes.
- **Justification Injection:** The justification/reason provided by the agent (via the Write Guard) must be included in the Odoo log or chatter to provide the "why" behind the change.
- **Attribution:** All logs must clearly distinguish between human-initiated actions and those performed by the AI agent on behalf of the user.

