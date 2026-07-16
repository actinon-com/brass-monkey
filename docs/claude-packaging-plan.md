# Claude Packaging Plan

**Goal:** Make Brass-Monkey installable and upgradeable on Claude, while keeping
Gemini CLI and Antigravity working unchanged.

**Target install surfaces (priority order):**
1. **Claude Code plugin + marketplace** — primary. Best "install once, upgrade
   from git" story; carries the 30 skills natively.
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
- [x] **Fetch and read current Claude Code plugin + marketplace docs.**
      → Verified 2026-07-15 at `code.claude.com` (docs.anthropic.com now 301s
      there): `/en/plugins`, `/en/plugins-reference`, `/en/plugin-marketplaces`.
      Manifests below follow the current schema.
- [x] Add the plugin manifest declaring the MCP server (same
      `node dist/bundle/index.js` launch) and pointing at `skills/`.
      → `.claude-plugin/plugin.json`. MCP server declared **inline** (not a
      separate root `.mcp.json`, which would also load as a *project*-scope
      server when the repo is opened in Claude Code, where
      `${CLAUDE_PLUGIN_ROOT}`/`${user_config.*}` don't resolve). Launch is
      `node ${CLAUDE_PLUGIN_ROOT}/dist/bundle/index.js`. First-run config via
      `userConfig` (URL/DB/username/alias + sensitive API key) injected as
      `ODOO_*` env — mirrors the Gemini `settings` array; each field defaults to
      `""` so blanks fall through cleanly to `setup_instance` (the
      `config-store.ts` truthy guard skips empty env). Skills auto-discovered by
      the default `skills/` scan (all 30). Legacy root `plugin.json` deleted;
      `sync-version.mjs` repointed to `.claude-plugin/plugin.json`.
- [x] Add the marketplace manifest so this repo is self-serve; document the
      `/plugin marketplace add actinon-com/brass-monkey` + install/upgrade flow.
      → `.claude-plugin/marketplace.json`, name **`odoo-actinon`**, single entry
      `brass-monkey` with `source: "./"` (repo root = marketplace root = plugin
      root; the plugin can't live in a subdir without forking Gemini's launch
      path). No `version` in the entry — `plugin.json` is the authority. Install:
      `/plugin install brass-monkey@odoo-actinon`; upgrade:
      `/plugin update brass-monkey@odoo-actinon`. Documented in README.
- [ ] Smoke-test: all tools register; all 30 skills load and trigger.
      → Automated gate green (see below). Manual Inspector/`--plugin-dir` +
      live-Odoo check is Matt's to run before merge (recipe below).
- **Done when:** a fresh Claude Code install can add the marketplace, install the
  plugin, connect to Odoo, and use tools + skills; upgrade pulls a new version.

  **Verification recipe:**
  1. `claude plugin validate . --strict` — marketplace + entry + manifest fields.
  2. Gate: `npm test`, `tsc --noEmit`, `node scripts/sync-version.mjs --check`.
  3. `claude --plugin-dir .` → `/help` lists 30 `brass-monkey:odoo-*` skills;
     `/plugin` prompts for the 5 userConfig fields.
  4. Fill prompts with live creds → `get_environment` connects with no
     `setup_instance` call (env-injection path).
  5. Leave prompts blank → `list_instances` empty, then `setup_instance` works
     (blank-field fallback; no literal `${...}` instance).
  6. `/plugin marketplace add ./` + `/plugin install brass-monkey@odoo-actinon`
     → same result from the plugin cache (keytar absent → encrypted-file path).
  Cross-OS (macOS/Windows) deferred post-release (Mike/Windows), as in Phase 2.

## Phase 4 — Claude Desktop bundle (secondary path)
- [x] **Fetch and read current desktop bundle docs; confirm format/name
      (`.dxt` vs `.mcpb`).**
      → Verified live 2026-07-15: the format is **`.mcpb`** (MCP Bundle; `.dxt`
      is the retired name). Spec **`manifest_version: "0.3"`** (confirmed against
      the authoritative `modelcontextprotocol/mcpb` hello-world example — a search
      summary's "0.4" was wrong). CLI is **`@anthropic-ai/mcpb`** (`mcpb validate
      <path>`, `mcpb pack <dir> [out]`); installed as a devDependency (v2.1.2).
      Sources: `claude.com/docs/connectors/building/mcpb`,
      `github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md` + `/CLI.md`.
- [x] Produce a bundle manifest whose user-config fields mirror the existing
      `settings` array (URL/DB/username/key; key flagged sensitive).
      → `manifest.json` (repo root). `server.type: node`, `entry_point:
      dist/bundle/index.js`, launch `node ${__dirname}/dist/bundle/index.js` —
      the same shared bundle. `user_config` mirrors the Phase 3 `userConfig`
      1:1 (alias/url/db/username + sensitive api_key), each injected as `ODOO_*`
      env via `${user_config.*}`. Every optional field is `required:false` +
      `default:""` (alias `default:"default"`) so blanks substitute to empty
      strings → the `config-store.ts` truthy guard skips → clean `setup_instance`
      fallback, identical to the Claude Code path. `tools_generated:true` (tools
      register dynamically; a static `tools[]` with annotations is only needed for
      Connectors-Directory submission, deferred). `compatibility`: claude_desktop
      >=0.10.0, platforms darwin/win32, node >=18.
- [x] Wire bundle creation into `npm run build`.
      → `scripts/stage-mcpb.mjs` + npm scripts `stage-mcpb` and `build:mcpb`
      (`stage → mcpb validate → mcpb pack build/mcpb-stage build/brass-monkey.mcpb`),
      chained into `build`. **Packaging is an allowlist stage, NOT `mcpb pack .` +
      `.mcpbignore`:** packing the repo root risks zipping the gitignored `.env`
      (live Odoo creds) into a shippable artifact if one ignore pattern is missed
      — a credential-isolation violation. The stage copies ONLY `manifest.json` +
      `dist/bundle/` into `build/mcpb-stage/`, so a secret leak is structurally
      impossible. Verified: the produced archive is exactly 3 files
      (`manifest.json`, `dist/bundle/index.js`, ncc's `dist/bundle/package.json`)
      — no `src/`, `node_modules`, `skills/`, or `.env`. `build/` + `*.mcpb` are
      gitignored (artifact belongs on GitHub Releases, Phase 6 — not committed;
      `dist/bundle` itself stays committed for the Gemini/plugin git-install path).
      `manifest.json` added to `sync-version.mjs` `JSON_TARGETS` (the `"version"`
      regex safely skips the `"manifest_version"` spec field).
- **Done when:** the bundle installs in Claude Desktop, prompts for config, and
  the server launches with config injected.

  **Automated gate (green 2026-07-15):** `mcpb validate` passes; `mcpb pack`
  produces `build/brass-monkey.mcpb` (270 KB); `sync-version --check` at 1.7.0
  incl. `manifest.json`; `tsc --noEmit` clean; `npm test` 82/82.

  **Known limitations (documented, not hidden):**
  - **Skills are not in the `.mcpb`.** The bundle format delivers the MCP server
    (the ~24 tools) only — Agent Skills aren't part of the manifest spec. Desktop
    users get the tools but not the 30 skills' guidance; Claude Code (Phase 3)
    remains the full-fidelity path. Noted in the manifest `long_description` and
    README §4.
  - **No icon yet** — optional per spec; needs a real 512×512 PNG. Polish item.
  - **Bundle unsigned** — `mcpb sign` is a distribution/Directory concern
    (Phase 6), not required for private install.

  **Manual verification (macOS/Windows — Matt's before merge; I'm on Linux):**
  1. Install `build/brass-monkey.mcpb` (double-click) → the install dialog shows
     the 5 config fields; the API-key field is masked.
  2. Fill live Odoo creds → the server launches and `get_environment` connects
     with no `setup_instance` call (env-injection path end-to-end).
  3. Leave all fields blank → `list_instances` empty (no literal `${...}`
     instance), then `setup_instance` works (blank-field fallback).

## Phase 5 — Skills polish
- [x] Sweep all 30 `SKILL.md` files: replace Gemini-specific phrasing (e.g.
      "the Gemini agent") with agent-neutral wording.
      → Exactly 30 occurrences, one per skill — all the identical Overview-line
      shape "This skill provides **the Gemini agent** with …". Uniform fix
      `the Gemini agent` → `the agent` (grammatical across every sentence
      variant, minimal diff). No other Gemini/Google branding in any skill (the
      `google_analytics_key` in `odoo-website/resources` is a genuine Odoo field
      — left untouched). Confirmed 0 `gemini` matches remain in `skills/*/SKILL.md`.
- [x] Confirm each `description` is a strong trigger string.
      → Reviewed all 30 frontmatter descriptions. Already actor-neutral and
      specific: 14 lead with `MANDATORY for … (model.name)` (strong triggers);
      the rest are topical "expertise in X". Adequate as-is — no rewrites, kept
      the diff surgical.
- [x] Confirm `resources/` progressive-disclosure paths resolve when loaded by
      Claude.
      → Convention is a `## Available Resources` section listing files by bare
      name. Audited all 30: 53 resource files, every reference resolved and zero
      orphans **except** `odoo-reports`, which listed `qweb-basics.md` with no
      `resources/` dir (dangling link). Fixed by authoring
      `skills/odoo-reports/resources/qweb-basics.md` (QWeb directives / document
      loop / external_layout reference, matched to the other resource files'
      depth). Re-audit: **0 missing, 0 orphans** across all 30.
- **Done when:** skills are agent-neutral and verified loading under Claude Code.
  ✅ **Met** (agent-neutral wording + reference integrity). Automated re-audit
  green; manual `claude --plugin-dir .` load check folds into the Phase 3
  smoke-test recipe (Matt's before merge).

## Phase 6 — Build, CI, upgrade mechanics
- [x] One `npm run build` emits: `dist/bundle`, the Desktop bundle, and validates
      the plugin/marketplace manifests.
      → `build` already emitted `dist/` + `dist/bundle` + `build/brass-monkey.mcpb`
      (the `.mcpb` gated by `mcpb validate`); the missing piece was validating the
      Claude Code manifests. Added `scripts/validate-plugin.mjs` — a
      **self-contained** Node validator (no `claude` CLI dependency, so it runs in
      CI) that checks `.claude-plugin/plugin.json` + `marketplace.json` parse, have
      required fields, the mcpServers `args` reference
      `${CLAUDE_PLUGIN_ROOT}/dist/bundle/index.js`, the marketplace entry is
      `{ name: brass-monkey, source: "./" }`, and plugin.version === package.json
      version. Wired first in the chain (fail-fast):
      `validate-plugin → tsc → bundle → build:mcpb`. `claude plugin validate
      --strict` stays as the authoritative *manual* smoke test (Phase 3 recipe).
- [x] GitHub Action on tag: build, attach the Desktop bundle to a Release; the
      marketplace serves the new version from the repo.
      → `.github/workflows/release.yml`: `on: push: tags: ['v*.*.*']`,
      `permissions: contents: write`. Mirrors `test.yml`'s env (ubuntu,
      `libsecret-1-dev`, `npm install`); guards that the tag (minus `v`) matches
      `package.json` version; runs `npm run build` then `npm test`; uploads
      `build/brass-monkey.mcpb` via `softprops/action-gh-release@v3`
      (`generate_release_notes: true`), which creates the Release if absent.
      Gemini + Claude Code marketplace install from the repo/tag directly, so the
      `.mcpb` is the only asset uploaded. `test.yml` (push/PR to `main`) is
      unchanged — tag pushes don't trigger it, hence the release job re-runs the
      gate. Versions verified live 2026-07-16: `action-gh-release@v3` (v2 EOL),
      `actions/checkout@v6`.
- [x] README: per-platform upgrade commands (Gemini, Claude Code, Desktop).
      → Added the missing `gemini extensions update brass-monkey` (verified live)
      to §2, plus a consolidated **"⬆️ Upgrading"** table (Gemini / Claude Code /
      Desktop) as the single reference. Claude Code (`/plugin update …`) and
      Desktop (reinstall `.mcpb`) commands already existed inline in §3/§4.
- **Done when:** tagging a release produces all artifacts and the upgrade paths
  are documented and tested.
  ✅ **Met** (automation + docs in place). **Automated gate (green 2026-07-16):**
  `validate-plugin` OK; `npm run build` full chain succeeds (validator + `tsc` +
  ncc bundle + `mcpb validate`/`pack` → `build/brass-monkey.mcpb`); `npm test`
  82/82; `tsc --noEmit` clean; `sync-version --check` all sources at 1.7.0.
  **First live exercise deferred to release time** (can't run pre-merge): the
  workflow only fires on a real `v*` tag pushed to `main`, which happens *after*
  the `release-1.7.0` → `main` PR merges. Confirm at tag `v1.7.0` that the Action
  builds and the Release shows `brass-monkey.mcpb` attached.

  **Still deferred (distribution polish — not required for install/upgrade):**
  static `tools[]` with annotations, `icon.png` (512×512), and `mcpb sign` for a
  Connectors-Directory submission. Unchanged from the Phase 4/5 notes.

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
| `manifest.json` → `build/brass-monkey.mcpb` | Claude Desktop |

All launch the identical `node dist/bundle/index.js`.
