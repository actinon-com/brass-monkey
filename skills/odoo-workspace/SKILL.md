# Skill: Odoo Workspace Management

This skill provides the Gemini agent with the expertise required to manage multiple Odoo environments, handle authentication, and switch between instances.

## Core Mandates

### 1. Multi-Instance Architecture
Brass-Monkey can manage multiple Odoo environments simultaneously. Each environment is identified by a unique `instance_alias` (e.g., "prod", "staging", "dev").

### 2. Configuration & Setup
- **Initial Setup:** If no instances are configured, use `setup_instance` to add the first one. You will need the Odoo URL, database name, username, and password/API key.
- **Verification:** `setup_instance` automatically validates credentials by attempting to authenticate.
- **Discovery:** Use `list_instances` to see which environments are currently configured.

### 3. Session Defaults & Switching
- **Default Instance:** By default, tool calls use the first configured instance or the one set via `switch_instance`.
- **Contextual Execution:** You can override the default for any tool call by providing the `instance_alias` parameter.
- **Workflow:** Use `switch_instance` to change the primary environment for a session (e.g., "Switching to staging to test these changes").

### 4. Cross-Instance Operations
You can move data between environments by reading from one instance and creating on another:
1. `data = search_read(model: '...', instance_alias: 'prod')`
2. `create_record(model: '...', values: data, instance_alias: 'staging')`
