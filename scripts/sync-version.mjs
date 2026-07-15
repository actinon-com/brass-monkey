#!/usr/bin/env node
/**
 * sync-version.mjs — single source of truth for the Brass-Monkey version.
 *
 * `package.json` is canonical. This script propagates its `version` into every
 * other place a version is declared, so the manifests can never drift:
 *   - gemini-extension.json        (Gemini CLI)
 *   - .claude-plugin/plugin.json   (Claude Code plugin manifest; authority for
 *                                   the plugin version — marketplace.json
 *                                   deliberately carries no plugin version)
 *   - src/mcp-server.ts            (runtime fallback literal only; the server
 *                                   reads package.json at runtime, this is the
 *                                   last resort)
 *
 * When the Desktop bundle manifest is added (plan Phase 4), append it to
 * JSON_TARGETS below.
 *
 * Usage:  node scripts/sync-version.mjs          (writes; run by `prebuild`)
 *         node scripts/sync-version.mjs --check   (verifies only; non-zero exit on drift)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const version = pkg.version;
if (!version) {
  console.error("sync-version: package.json has no 'version' field");
  process.exit(1);
}

// JSON manifests whose top-level "version" must match package.json.
const JSON_TARGETS = ["gemini-extension.json", ".claude-plugin/plugin.json"];

const drift = [];

for (const rel of JSON_TARGETS) {
  const file = resolve(ROOT, rel);
  const text = readFileSync(file, "utf-8");
  const current = JSON.parse(text).version;
  if (current === version) continue;
  // Minimal in-place edit of the top-level "version" field only — preserve all
  // other formatting so the diff stays surgical.
  const re = /("version"\s*:\s*")([^"]*)(")/;
  if (!re.test(text)) {
    console.error(`sync-version: could not find a "version" field in ${rel}`);
    process.exit(1);
  }
  drift.push(`${rel}: ${current} → ${version}`);
  if (!CHECK_ONLY) {
    writeFileSync(file, text.replace(re, `$1${version}$3`));
  }
}

// src/mcp-server.ts fallback literal: `let version = "x.y.z";`
{
  const rel = "src/mcp-server.ts";
  const file = resolve(ROOT, rel);
  const src = readFileSync(file, "utf-8");
  const re = /(let version = ")([^"]*)(";)/;
  const m = src.match(re);
  if (!m) {
    console.error(`sync-version: could not find version fallback literal in ${rel}`);
    process.exit(1);
  }
  if (m[2] !== version) {
    drift.push(`${rel}: ${m[2]} → ${version}`);
    if (!CHECK_ONLY) {
      writeFileSync(file, src.replace(re, `$1${version}$3`));
    }
  }
}

if (CHECK_ONLY) {
  if (drift.length) {
    console.error(`sync-version: version drift detected (canonical ${version}):`);
    for (const d of drift) console.error(`  - ${d}`);
    console.error("Run `npm run sync-version` to fix.");
    process.exit(1);
  }
  console.log(`sync-version: all sources agree at ${version}`);
} else {
  if (drift.length) {
    console.log(`sync-version: synced to ${version}`);
    for (const d of drift) console.log(`  - ${d}`);
  } else {
    console.log(`sync-version: already in sync at ${version}`);
  }
}
