# Execution Safety Model

How Brass-Monkey keeps a human in the loop for irreversible operations, and
where that model has gaps you should know about.

Introduced in 2.1.0 alongside `execute_action` and `execute_method`.

## The three layers

### 1. Mandatory justification (all hosts)

Every state-changing tool requires a `justification` string, recorded to three
places: the local `~/.gemini/brass-monkey/audit.jsonl` history, Odoo's
`ir.logging`, and the target record's Chatter. This is enforced server-side by
Zod, so it holds regardless of client.

### 2. Pre-flight classification (all hosts)

`execute_action` and `execute_method` inspect what they are about to run before
running it, via `src/services/execution-guard.ts`:

- the full `ir.actions.server` tree is expanded, including `child_ids`, and
  classified on the union — a `multi` action containing one Python step is
  treated as Python;
- `execute_method` refuses ORM primitives outright (`write`, `create`,
  `unlink`, ...) so it cannot bypass the guards on the dedicated CRUD tools;
- a before-snapshot is captured where the effect is declarative, and where it is
  not, the audit entry records *why* rather than logging an empty object.

Unsafe operations are refused unless the caller passes `acknowledge_unsafe`.

### 3. Forced permission prompt (Claude Code only)

Layer 2 has a structural weakness: `acknowledge_unsafe` assumes a human sees the
refusal. In Claude Code's `auto` and `bypassPermissions` modes there is no
permission prompt, so the agent can read its own refusal and immediately retry
with the flag set — and no person ever reviews the Python it acknowledged.

Two tools therefore advertise `_meta["anthropic/requiresUserInteraction"]` in
their `tools/list` entry:

| Tool | Why |
| --- | --- |
| `unlink_record` | irreversible |
| `execute_action` | arbitrary Python; makes `acknowledge_unsafe` meaningful |

Claude Code responds by showing that tool's permission prompt **on every call,
even in `acceptEdits`, `auto` and `bypassPermissions`**, with no "don't ask
again" option, and ignores any `allow` rule that would otherwise skip it.

The annotation is deliberately **not** set on `write_record`, `create_record` or
`execute_method`. It forces a prompt on every single call, and applying it to
routine data work would make auto mode unusable.

## Known limits

Be explicit about these rather than assuming you are covered.

- **Claude Code only.** Gemini CLI and Antigravity ignore `_meta`. On those
  hosts, layers 1 and 2 are the whole story.
- **Requires Claude Code v2.1.199 or later.** Older versions ignore the
  annotation silently — no warning, no fallback.
- **Static, not argument-aware.** The annotation is declared once in
  `tools/list`, so it cannot be conditional on arguments; there is no way to
  prompt only for a particular model or instance alias. Gating on arguments
  would need MCP elicitation, which is not implemented.
- **Headless pipelines break.** Under `--permission-prompt-tool`, an `allow`
  result for a flagged tool is converted to a deny. Any unattended pipeline that
  calls `unlink_record` or `execute_action` will stop working. The Agent SDK's
  `canUseTool` callback does receive these calls and can approve them.
- **`dontAsk` mode denies.** A flagged tool is refused outright rather than
  prompted.

## If you need a harder guarantee

The annotation is shipped by us and needs no user configuration, but it is not a
policy control. For enforcement the agent cannot influence at all:

- **`permissions.deny`** in your own settings, matching the scoped tool name
  `mcp__plugin_brass-monkey_brass-monkey-odoo__unlink_record`.
- **Managed/enterprise settings** with `allowManagedPermissionRulesOnly`, which
  stop user and project settings defining their own rules.
- **A `PreToolUse` hook**, which runs regardless of permission mode and can
  return `permissionDecision: "deny"` or `"ask"`. Plugins can bundle hooks in
  `hooks/hooks.json`; Brass-Monkey does not ship any today.
