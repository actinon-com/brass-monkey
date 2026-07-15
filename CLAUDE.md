# Brass-Monkey — Claude Code Working Context

> This file mirrors the intent of `GEMINI.md` for Claude Code. Where the two
> overlap, they must stay consistent. If you prefer a single source of truth,
> replace the "Shared Mandates" section below with an import of `GEMINI.md`
> (verify the current import syntax against the Claude Code docs before relying
> on it).

## Current Initiative: Claude Packaging (v1.6.x → Claude-installable)

Brass-Monkey already ships as a working stdio MCP server consumed by Gemini CLI
and Antigravity. The active goal is to make it **installable and upgradeable on
Claude** (Claude Code plugin + marketplace as the primary path; a Claude Desktop
bundle as a secondary path; raw `claude mcp add` as the universal fallback) while
keeping Gemini/Antigravity working unchanged.

The work is tracked as a checklist in **`docs/claude-packaging-plan.md`**. Treat
that file as the source of truth for progress: read it at the start of a session,
check off items as their "Done when" criteria are met, and commit the updated
file.

### Non-negotiable rules for this initiative

1. **Verify formats against live docs — do not trust memory.** Before
   implementing the Claude Code plugin/marketplace phase or the Desktop bundle
   phase, fetch and read the current official documentation and follow the live
   schema:
   - Claude Code docs map: `https://docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md`
   - Claude docs: `https://docs.claude.com`
   Plugin manifest structure, marketplace manifest structure, and the desktop
   bundle format/name (`.dxt` vs `.mcpb`) all change; confirm them before writing
   any manifest.
2. **Branch protection.** `main` is protected. All work happens on a
   `release-1.6.x` (or `release-1.7.0` if treated as a feature bump) branch.
   Never commit directly to `main`. Finalize via Pull Request; the Author (Matt)
   reviews and merges.
3. **Additive, not forking.** The stdio MCP server (`src/mcp-server.ts` →
   `dist/bundle/index.js`) is the shared core. Each ecosystem gets its own thin
   manifest pointing at the same launch command. Do not fork server logic per
   platform.
4. **One phase per session.** Use plan mode to propose before editing, gate each
   phase on `npm test` + a manual MCP Inspector check, commit, then compact/clear
   before the next phase.

---

## Shared Mandates (consistent with GEMINI.md)

### Explanations First & Buy-in
ALWAYS provide a technical explanation of proposed changes and seek approval
BEFORE modifying files or running state-changing commands. Treat reports of bugs
or concerning behavior as **Inquiries** (research/strategy) rather than
**Directives** (immediate action) until a plan is agreed. For any change
affecting more than one file, modifying tool logic, or altering architectural
patterns, present a strategy and wait for explicit buy-in.

### Structural Fixes over Band-aids
Prioritize correcting the root cause over restrictive guards or tool-level
blocks. If the agent gets confused, first audit the orientation data and skill
guidance; fix the guidance before hard-coding restrictions.

### Release Workflow
- All release work on a dedicated release branch (e.g., `release-1.7.0`).
- **Version sync:** keep versions synchronized across `package.json`,
  `gemini-extension.json`, the default version in `src/mcp-server.ts`, and any
  new Claude manifests. (Phase 0 introduces a single-source mechanism for this.)
- Merge to `main` via PR; Author reviews/merges. Tag `main` (e.g., `v1.7.0`)
  after merge and clean up the release branch.

---

## Technical Mandate
- **Language:** TypeScript (strict mode). **Modules:** ESM.
- **Validation:** `zod` for all tool parameters and Odoo response validation.
- **Performance:** async for all RPC calls.
- **Build:** `npm run build` (`tsc` + `ncc` bundle to `dist/bundle`).
- **Test:** `npm test` (vitest). Live/manual checks via `./start-inspectors.sh`.

## Architecture
- `src/tools/` — Odoo-bridge tools (RPC wrappers, metadata discovery).
- `src/services/` — connectivity, auth, caching, orchestration, auditing.
- `src/schemas/` — Zod schemas.
- `skills/` — 23 domain skills. **These already use Anthropic Agent Skills
  format** (`SKILL.md` with `name`/`description` frontmatter + `resources/`).
  Reuse them for Claude; do not rewrite the format.
- `docs/` — technical docs and implementation plans.

## Security & Data Protection
- **Zero-log policy:** never log Odoo tokens, passwords, or sensitive record data.
- **Credential isolation:** OS keychain (`keytar`) or env vars; never commit
  secrets. Note `keytar` is a native module — treat cross-platform bundling of
  its prebuilt binary as a known packaging risk (see plan Phase 2).
- **Write guards:** state-changing tools require an explicit `justification`,
  logged to `ir.logging` + Chatter with agent/human attribution.
