#!/usr/bin/env node
/**
 * stage-mcpb.mjs — assemble a secret-safe staging tree for the Claude Desktop
 * bundle (`.mcpb`), then let `mcpb pack` zip it.
 *
 * WHY an allowlist stage instead of `mcpb pack .` + `.mcpbignore`:
 * packing the repo root risks zipping the gitignored `.env` (live Odoo
 * credentials) into a shippable artifact if a single ignore pattern is missed —
 * a credential-isolation violation. This copies ONLY the two things the bundle
 * needs (the manifest + the self-contained ncc bundle), so a secret leak is
 * structurally impossible.
 *
 * Layout produced (matches manifest `entry_point: dist/bundle/index.js`):
 *   build/mcpb-stage/manifest.json
 *   build/mcpb-stage/dist/bundle/**
 *
 * Consumed by the `build:mcpb` npm script:
 *   mcpb validate build/mcpb-stage/manifest.json
 *   mcpb pack     build/mcpb-stage build/brass-monkey.mcpb
 */

import { rmSync, mkdirSync, cpSync, copyFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STAGE = resolve(ROOT, "build/mcpb-stage");
const BUNDLE_SRC = resolve(ROOT, "dist/bundle");
const MANIFEST_SRC = resolve(ROOT, "manifest.json");

if (!existsSync(resolve(BUNDLE_SRC, "index.js"))) {
  console.error(
    "stage-mcpb: dist/bundle/index.js not found — run `npm run bundle` first.",
  );
  process.exit(1);
}
if (!existsSync(MANIFEST_SRC)) {
  console.error("stage-mcpb: manifest.json not found at repo root.");
  process.exit(1);
}

// Clean and recreate the staging tree.
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(resolve(STAGE, "dist"), { recursive: true });

// Copy ONLY the manifest and the self-contained bundle. Nothing else.
copyFileSync(MANIFEST_SRC, resolve(STAGE, "manifest.json"));
cpSync(BUNDLE_SRC, resolve(STAGE, "dist/bundle"), { recursive: true });

console.log(`stage-mcpb: staged manifest + dist/bundle -> ${STAGE}`);
