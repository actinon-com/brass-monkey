#!/usr/bin/env node
/**
 * validate-plugin.mjs — structural gate for the Claude Code plugin +
 * marketplace manifests, run as part of `npm run build`.
 *
 * WHY a self-contained Node script instead of `claude plugin validate`:
 * the build (and CI) must not depend on the `claude` CLI being installed and
 * authenticated. This performs the structural checks that matter for shipping —
 * valid JSON, required fields, the entry-point wiring, and version parity with
 * package.json — with zero external dependencies. `claude plugin validate
 * --strict` remains the authoritative manual smoke test (see the Phase 3
 * verification recipe in docs/claude-packaging-plan.md).
 *
 * Checks:
 *   .claude-plugin/plugin.json
 *     - parses; has "name" and "version"
 *     - "version" === package.json "version" (belt-and-braces with sync-version)
 *     - an mcpServers entry whose args reference
 *       ${CLAUDE_PLUGIN_ROOT}/dist/bundle/index.js
 *   .claude-plugin/marketplace.json
 *     - parses; has "name", "owner", and a non-empty "plugins" array
 *     - contains a plugin entry { name: "brass-monkey", source: "./" }
 *       (name matches plugin.json)
 *
 * Usage:  node scripts/validate-plugin.mjs   (non-zero exit + message on failure)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function readJson(rel) {
  const file = resolve(ROOT, rel);
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    errors.push(`${rel}: could not read/parse — ${e.message}`);
    return null;
  }
}

const pkg = readJson("package.json");
const plugin = readJson(".claude-plugin/plugin.json");
const market = readJson(".claude-plugin/marketplace.json");

const ENTRY = "${CLAUDE_PLUGIN_ROOT}/dist/bundle/index.js";

// --- plugin.json ---------------------------------------------------------
if (plugin) {
  if (!plugin.name) errors.push(".claude-plugin/plugin.json: missing \"name\"");
  if (!plugin.version) errors.push(".claude-plugin/plugin.json: missing \"version\"");

  if (pkg && plugin.version && plugin.version !== pkg.version) {
    errors.push(
      `.claude-plugin/plugin.json: version ${plugin.version} != package.json ${pkg.version} ` +
        "(run `npm run sync-version`)",
    );
  }

  const servers = plugin.mcpServers;
  if (!servers || typeof servers !== "object" || Object.keys(servers).length === 0) {
    errors.push(".claude-plugin/plugin.json: no mcpServers entry");
  } else {
    const referencesEntry = Object.values(servers).some(
      (s) => Array.isArray(s?.args) && s.args.includes(ENTRY),
    );
    if (!referencesEntry) {
      errors.push(
        `.claude-plugin/plugin.json: no mcpServers entry with args referencing "${ENTRY}"`,
      );
    }
  }
}

// --- marketplace.json ----------------------------------------------------
if (market) {
  if (!market.name) errors.push(".claude-plugin/marketplace.json: missing \"name\"");
  if (!market.owner) errors.push(".claude-plugin/marketplace.json: missing \"owner\"");

  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    errors.push(".claude-plugin/marketplace.json: \"plugins\" must be a non-empty array");
  } else {
    const wanted = plugin?.name ?? "brass-monkey";
    const entry = market.plugins.find((p) => p?.name === wanted);
    if (!entry) {
      errors.push(
        `.claude-plugin/marketplace.json: no plugin entry named "${wanted}" (matching plugin.json)`,
      );
    } else if (entry.source !== "./") {
      errors.push(
        `.claude-plugin/marketplace.json: plugin "${wanted}" source is "${entry.source}", expected "./"`,
      );
    }
  }
}

if (errors.length) {
  console.error("validate-plugin: manifest validation FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `validate-plugin: plugin + marketplace manifests OK (plugin "${plugin.name}" @ ${plugin.version}, marketplace "${market.name}").`,
);
