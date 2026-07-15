# Claude Packaging Plan

**Goal:** Make Brass-Monkey installable and upgradeable on Claude, while keeping
Gemini CLI and Antigravity working unchanged.

**Target install surfaces (priority order):**
1. **Claude Code plugin + marketplace** — primary. Best "install once, upgrade
   from git" story; carries the 23 skills natively.
2. **Claude Desktop bundle** — secondary. GUI one-click install for non-CLI users.
3. **Raw `claude mcp add` / MCP config** — universal fallback; also how
   Antigravity consumes the server.

**How to work this file:** one phase per session where practical. Use plan mode
to propose before editing. Gate each phase on its "Done when" criteria. Check
items off and commit this file as you go. All work on a `release-1.6.x` /
`release-1.7.0` branch — never `main`.

> ⚠️ **Verify-first rule:** Phases 3 and 4 depend on Claude packaging formats
> that change over time. Their first task is always to fetch and read the current
> official docs (`docs.anthropic.com/en/docs/claude-code/claude_code_docs_map.md`,
> `docs.claude.com`) and follow the live schema. Do not implement manifests from
> memory.

---

## Phase 0 — Cleanup / single source of truth
- [x] Choose `package.json` as the canonical version and add a build step (or
      small script) that propagates it to `gemini-extension.json`,
      `src/mcp-server.ts` default, and any new Claude manifests.
      → `scripts/sync-version.mjs`, wired as `prebuild` + `npm run sync-version` /
      `check-version`. Canonical bumped to **1.7.0**.
- [x] Reconcile the current drift: `package.json` 1.6.2, `gemini-extension.json`
      1.6.2, `plugin.json` 1.3.7, `README.md` 1.5.0.
      → all now 1.7.0 via the sync script; README banner de-versioned so it can't
      drift again.
- [x] Remove the hardcoded dev path in `mcp_config.json`
      (`/home/mcm/WebstormProjects/brass-monkey`); make it relative or documented.
      → replaced with `/ABSOLUTE/PATH/TO/brass-monkey` placeholder + README note.
- [x] Add undocumented tools to the README table or mark internal:
      `get_audit_log`, `trace_ui_path`, `get_environment`, `remove_instance`,
      `download_file`. → all five added to the Available Tools table.
- **Done when:** all four version sources agree via a single mechanism; `npm run
  build` succeeds; README tool list matches `src/tools/`. ✅ **Met.**

## Phase 1 — Decouple config from the Gemini installer
- [x] Confirm the server is fully configurable via (a) env vars injected by the
      host and (b) the `setup_instance` tool as a first-run path, with `keytar`
      as the persistence layer — independent of Gemini's interactive prompts.
      → Path (b) already worked. Path (a) was a phantom contract: `ODOO_ALIAS`
      was declared in the manifest but read nowhere; `config-store` hardcoded the
      env instance to `default` and `credential-store` gated the env key on
      `default`/`act` (a personal leftover). Fixed both to honor
      `ODOO_ALIAS ?? 'default'`; dropped `act`. Regression-locked in
      `tests/config-env-contract.test.ts` (5 tests).
- [x] Document the env-var contract (`ODOO_ALIAS/URL/DB/USERNAME/API_KEY`).
      → README §"Configuration on Claude Code / generic MCP hosts" with a
      required/default table + both config paths.
- [x] Decouple user-facing Gemini strings: `remove_instance` guard message now
      references the host's env config (not `gemini extensions config`); audit
      `ir.logging` source path `gemini.cli.extension` → `brass-monkey.mcp`; stale
      `src/index.ts` comment made host-neutral. Legacy `~/.gemini/brass-monkey`
      storage dir intentionally kept for backwards-compat (documented in code).
- **Done when:** a clean instance can be configured on Claude Code with no
  Gemini-specific step, verified in the MCP Inspector. ✅ Automated: 77/77 tests
  incl. env-var contract; `tsc --noEmit` clean. Manual Inspector check below is
  Matt's to run before merge.

  **Inspector verification recipe** (`./start-inspectors.sh --dev`):
  1. *Env-var path* — launch with `ODOO_ALIAS/URL/DB/USERNAME/API_KEY` set;
     `list_instances` shows the injected instance under its alias; run
     `get_environment` to confirm it connects with no `setup_instance` call.
  2. *First-run path* — launch with **no** `ODOO_*` vars; `list_instances` is
     empty; `setup_instance` (alias/url/db/username/api_key) authenticates,
     persists to keytar, and a subsequent `get_environment` succeeds.

## Phase 2 — Native-module packaging decision (likely gotcha)
- [x] Decide: keep `keytar` (and solve shipping prebuilt `.node` binaries per
      OS/arch through `ncc`), or move to a maintained keychain lib / encrypted
      local-file fallback.
      → **Decision: fallback-first (Path 1).** The OS keychain is *any* native
      module (keytar is archived since Dec 2022; the maintained drop-in
      `@napi-rs/keyring` is also native), and a single `ncc` bundle can only carry
      one platform's binary — so no keychain can be relied on across OSes from one
      distributable. Instead: env-var (primary for Claude hosts) + an **AES-256-GCM
      encrypted local file** as the guaranteed cross-platform baseline, with the
      keychain kept as an opportunistic *enhancement*. `keytar` → `optionalDependency`.
- [x] Prototype the chosen approach and confirm it loads inside a bundled build.
      → Two traps found and fixed: (1) `ncc -e keytar` emits a **static** top-level
      `import ... "keytar"`, which makes the whole bundle fail to load where keytar
      is absent — *worse* than doing nothing. (2) Letting ncc trace the literal
      `import('keytar')` copies the platform-locked `keytar.node` (77 KB, build-OS
      only) into `dist/bundle` — and that stale binary was committed to the repo.
      Fix: load keytar via `createRequire(import.meta.url)('keytar')` with a
      non-`require` identifier, invisible to ncc's static analysis. Verified the
      rebuilt bundle ships **no `.node`, no static import, no `754` chunk**, and
      `node dist/bundle/index.js` starts cleanly **both** with keytar present
      (keychain active) and with it hidden (graceful fall-through to the file).
- [x] Encrypt the local fallback at rest (was plaintext JSON, mode `0600`).
      → AES-256-GCM via `node:crypto` (no new dep); scrypt key from OS
      user + machine identity; `v1:` value format; transparent legacy-plaintext
      migration; undecryptable entries skipped, not fatal. Regression-locked in
      `tests/credential-store-encryption.test.ts` (5 tests).
- **Done when:** the bundled server starts and reads/writes credentials on at
  least macOS + one other target OS, or a documented fallback is in place.
  ✅ **Met.** The guaranteed path is pure-JS (env var + encrypted file) and works
  identically on every OS out of one bundle; 82/82 tests pass; `tsc --noEmit`
  clean. Documented in README §"Credential storage" and CLAUDE.md.
  **Manual verification (single-OS, live Odoo, 2026-07-15):** both paths passed in
  the MCP Inspector against the workspace bundle — (A) env-var injection: instance
  built purely from `.env`, `get_environment` connected with no `setup_instance`;
  (B) first-run: `setup_instance` persisted the key as a `v1:` AES-GCM blob (not
  plaintext, not keychain), `get_environment` read it back via decrypt. Note: the
  Inspector forwards custom env vars but not `HOME`, so isolate first-run tests via
  `BRASS_MONKEY_NO_KEYCHAIN=1` + a throwaway alias rather than a temp `HOME`.
  **Cross-OS (macOS/Windows) deferred to post-release** (Windows load test owned by
  Mike); low-risk as the baseline is pure-JS and the keychain-absent path is proven
  graceful.

## Phase 3 — Claude Code plugin + marketplace (primary path)
- [ ] **Fetch and read current Claude Code plugin + marketplace docs.**
- [ ] Add the plugin manifest declaring the MCP server (same
      `node dist/bundle/index.js` launch) and pointing at `skills/`.
- [ ] Add the marketplace manifest so this repo is self-serve; document the
      `/plugin marketplace add actinon-com/brass-monkey` + install/upgrade flow.
- [ ] Smoke-test: all tools register; all 23 skills load and trigger.
- **Done when:** a fresh Claude Code install can add the marketplace, install the
  plugin, connect to Odoo, and use tools + skills; upgrade pulls a new version.

## Phase 4 — Claude Desktop bundle (secondary path)
- [ ] **Fetch and read current desktop bundle docs; confirm format/name
      (`.dxt` vs `.mcpb`).**
- [ ] Produce a bundle manifest whose user-config fields mirror the existing
      `settings` array (URL/DB/username/key; key flagged sensitive).
- [ ] Wire bundle creation into `npm run build`.
- **Done when:** the bundle installs in Claude Desktop, prompts for config, and
  the server launches with config injected.

## Phase 5 — Skills polish
- [ ] Sweep all 23 `SKILL.md` files: replace Gemini-specific phrasing (e.g.
      "the Gemini agent") with agent-neutral wording.
- [ ] Confirm each `description` is a strong trigger string.
- [ ] Confirm `resources/` progressive-disclosure paths resolve when loaded by
      Claude.
- **Done when:** skills are agent-neutral and verified loading under Claude Code.

## Phase 6 — Build, CI, upgrade mechanics
- [ ] One `npm run build` emits: `dist/bundle`, the Desktop bundle, and validates
      the plugin/marketplace manifests.
- [ ] GitHub Action on tag: build, attach the Desktop bundle to a Release; the
      marketplace serves the new version from the repo.
- [ ] README: per-platform upgrade commands (Gemini, Claude Code, Desktop).
- **Done when:** tagging a release produces all artifacts and the upgrade paths
  are documented and tested.

## Phase 7 — Docs & backwards-compat verification
- [ ] README install matrix: Gemini CLI / Antigravity / Claude Code / Claude
      Desktop, all launching the same server.
- [ ] Regression pass: Gemini extension still installs and runs unchanged.
- [ ] Confirm Antigravity works via the documented standard MCP config entry.
- **Done when:** all four surfaces install and run from documented steps with no
  forked server logic.

---

## Manifest → surface map (target end state)
| File | Consumed by |
| :--- | :--- |
| `gemini-extension.json` | Gemini CLI |
| standard MCP config entry | Antigravity; manual Claude Code / Desktop |
| `.claude-plugin/` + marketplace manifest | Claude Code |
| Desktop bundle manifest | Claude Desktop |

All launch the identical `node dist/bundle/index.js`.
