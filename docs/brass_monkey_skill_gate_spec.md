# Specification: Brass-Monkey Skill Gate

## 1. Problem Statement
AI agents often exhibit "speculative execution" bias, where they attempt to query Odoo models based on general ERP knowledge rather than local environment specifics. This leads to:
1. **Hallucinated Schema:** Guessing field names or relationship cardinalities that differ in the target instance.
2. **Context Bloat:** Failed tool calls and error traces consuming valuable context window.
3. **Protocol Violations:** Bypassing expert instructions contained in domain-specific skills.

## 2. Objective
Implement a "Skill Gate" within the `brass-monkey` MCP server that mandates the activation of a domain-specific skill before allowing read/write operations on associated Odoo models.

## 3. Architecture

### 3.1 Domain-to-Model Mapping
The MCP server shall maintain a registry of "Expert Domains" and their associated model prefixes.

| Domain Skill | Model Prefix (Regex/Glob) |
| :--- | :--- |
| `odoo-sales` | `sale.*`, `crm.team`, `res.partner` (partial) |
| `odoo-finance` | `account.*`, `res.currency`, `payment.*` |
| `odoo-inventory` | `stock.*`, `product.*`, `uom.*` |
| `odoo-mrp` | `mrp.*` |
| `odoo-projects` | `project.*`, `account.analytic.line` |

### 3.2 Session State Gating
The MCP server will track "Activated Skills" for the duration of a session (or per-instance connection).

- **Initialization:** When a session starts, the `ActivatedSkills` set is empty.
- **Skill Activation:** When the `activate_skill` tool is called, the skill name is added to the `ActivatedSkills` set.
- **Gated Tools:** The following tools must check the `ActivatedSkills` set before execution:
    - `search_read`
    - `create_record`
    - `write_record`
    - `unlink_record`
    - `inspect_model` (Optional, but recommended for strict adherence)

### 3.3 Enforcement Logic
When a gated tool is called for a model (e.g., `sale.order`):
1. Resolve the model's required skill (e.g., `odoo-sales`).
2. If `required_skill` is NOT in `ActivatedSkills`:
    - Intercept the call.
    - Return a standardized error: `DOMAIN_LOCKED`.
    - Error Message: *"Access to model 'sale.order' is locked. You must first activate the 'odoo-sales' skill to internalize the expert domain rules for this operation."*
3. If `required_skill` IS in `ActivatedSkills`, proceed with the RPC call.

## 4. Enhanced Metadata (Discovery)

### 4.1 `list_models` Update
The `list_models` tool should return a `required_skill` attribute for each model entry.
- **UI Impact:** This provides the agent with a "breadcrumb" to follow. When I see a model in a list, I immediately see the "key" (skill) required to unlock it.

### 4.2 `get_environment` Update
Include a list of `active_skills` in the environment summary. This allows the agent to verify its own state during a "World Map" refresh.

## 5. Implementation Roadmap

### Phase 1: The Registry
- Define the `DomainMap` interface in `src/types`.
- Populate a default mapping for the core 23 Odoo skills.

### Phase 2: The Middleware
- Implement a `SkillGuard` class in the MCP server.
- Add a pre-execution hook to the `OdooTool` runner to validate skill state.

### Phase 3: Error Standardisation
- Define a new `Zod` schema for `DomainLockedError`.
- Ensure the error message explicitly tells the agent *which* skill to call.

## 6. UX & Agent Impact
This change shifts the agent's behavior from **Speculative (Probabilistic)** to **Procedural (Deterministic)**.
- **Improved Accuracy:** The agent is forced to read the "Expert Rules" before interacting with the database.
- **Reduced Latency:** Fewer "trial and error" turns for complex relational queries.
- **Enhanced Safety:** The "Write Guard" becomes more effective as it is backed by domain-specific safety instructions.
