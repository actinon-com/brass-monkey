# Brass-Monkey (Gemini CLI Extension for Odoo)

## Project Mandate
Brass-Monkey replaces **Brass-Compass**, a prototype Python MCP server, with a modern, secure, and intelligent Node.js bridge for Odoo. It provides AI agents with a high-fidelity interface to Odoo's CRM, ERP, and business logic layers.

> **Source Reference:** Original Python implementation: [brass-compass](https://github.com/actinon-com/brass-compass.git)

## Critical Protocols

### 1. Orientation (The "World Map" Rule)
- **Mandate:** Your ABSOLUTE FIRST ACTION when starting a new session or connecting to an Odoo instance for the first time **MUST** be:
    1.  **Activate** the `odoo-get-started` skill.
    2.  **Execute** `get_environment` to establish a context "World Map".
- **Reasoning:** Odoo instances vary wildly. "Blind" discovery via multiple `search_read` calls is inefficient and error-prone. One `get_environment` call provides server version, user permissions, active company, and installed apps.
- **Enforcement:** Failure to orient before executing business logic is considered a violation of project standards.

### 2. Explanations First & Buy-in
- **Mandate:** ALWAYS provide a technical explanation of proposed changes and seek user understanding/approval BEFORE modifying files or executing state-changing commands.
- **UI Transparency:** When using state-changing tools (`create_record`, `write_record`, `unlink_record`), you MUST describe the intended change and the specific values in the chat message *before* calling the tool. Because tool parameters are often truncated in the UI, the chat message is the primary source of truth for user approval.
- **Enforcement:** For any change affecting more than one file, modifying tool logic, or altering architectural patterns, you MUST present a strategy and wait for explicit user buy-in. Treat reports of bugs or concerning behavior as **Inquiries** (Research/Strategy) rather than Directives (Immediate Action) until a plan is agreed upon.

### 4. Structural Fixes over Band-aids
- **Mandate:** Prioritize correcting the root cause of agent confusion over implementing restrictive "Write Guards" or tool-level blocks. 
- **Pattern:** If an agent makes a mistake, first audit the **Orientation (World Map)** data provided by `get_environment` and the **Skill** instructions. Fix the data presentation or the guidance before resorting to hard-coded tool restrictions.

### 3. Release Workflow
- **Branching:** All release work must be performed on a dedicated release branch (e.g., `release-1.3.4`).
- **Versioning:** Ensure versions are synchronized and incremented properly across `package.json`, `gemini-extension.json`, and the default version in `src/mcp-server.ts`.
- **Pull Requests:** Once work is complete and verified, use a Pull Request to merge the release branch into `main`. 
- **Finalization:** The Author (Matt) will review and complete the merge on GitHub.
- **Cleanup:** After a successful merge, cleanup any local/remote release branches and add a corresponding version tag (e.g., `v1.3.4`) to the `main` branch.

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

## Implementation Status: ✅ INITIAL RELEASE COMPLETE

All foundational and functional phases have been completed and verified against Odoo v18.

### Completed Milestones:
- **Phase 1: Foundation:** Secure TypeScript/ESM bridge with OS-level keychain encryption (`keytar`).
- **Phase 2: Multi-Instance:** Context-aware management of multiple Odoo environments.
- **Phase 3: Operational Tools:** End-to-end verified suite for Discovery, UX, safe Audit-driven CRUD, and Reports.
- **Phase 4: Domain Mastery:** 23 specialized skills covering the full Odoo ERP/CRM spectrum.
- **Phase 5: System Validation:** End-to-end Live Diagnostic suite passing on live databases.

### Future Evolution:
- **Session-based Auth:** Full implementation of JSON-RPC/Google OAuth using the established skeleton.
- **Advanced BI:** Deeper automation of O-Spreadsheet JSON generation for bespoke dashboards.
- **Technical Extension:** Tools for direct Python execution and source-level debugging.

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

