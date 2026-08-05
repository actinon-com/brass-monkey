# Contributing to Brass-Monkey

Thanks for considering a contribution. Brass-Monkey is an MCP server that talks
to live Odoo instances, so a few of the rules below are stricter than you might
expect from a small TypeScript project — please skim the two **Hard rules** before
opening a pull request, as they are enforced by CI and will otherwise fail your
build.

## Hard rules

### 1. Never commit changes to `dist/`

`dist/` is a **generated build artifact that is committed to the repository**, and
CI will reject any pull request from a fork that modifies it.

That is an unusual arrangement, so here is the reasoning. The Gemini extension and
the Claude Code marketplace install Brass-Monkey *straight from the repository or
tag* — `dist/bundle/index.js` is not merely a build output, it is the file end
users execute. The test suite runs `npm run build` before `npm test`, which
regenerates that bundle in the runner, so a pull request carrying a hand-modified
bundle would have its changes silently overwritten during testing, pass every
check, and still ship that bundle to users on merge. Since nobody can meaningfully
review a minified diff, the artifact is gated rather than reviewed.

**Submit source changes only** — `src/`, `skills/`, `docs/`, `tests/`, manifests.
A maintainer regenerates and commits `dist/` at release time.

Because `npm run build` rewrites `dist/`, running a local build will dirty your
working tree. Before pushing:

```bash
git checkout origin/main -- dist/
```

Or simply avoid committing it: `git add src/ tests/` rather than `git add -A`.

### 2. Sign off your commits (DCO)

Every commit needs a `Signed-off-by` line, certifying that you wrote the
contribution or otherwise have the right to submit it under this project's MIT
licence. See the [Developer Certificate of Origin](https://developercertificate.org/).

```bash
git commit -s -m "Your message"      # adds the line automatically
```

Forgot? Fix it before pushing:

```bash
git commit --amend --signoff         # most recent commit
git rebase --signoff origin/main     # every commit on your branch
git push --force-with-lease
```

There is no CLA. The project is MIT licensed and GitHub's terms already make your
contribution available under the same licence; the sign-off exists for provenance,
not to reassign your rights.

## Workflow

You will not have write access to this repository, which is intentional — all
outside contributions arrive as fork pull requests.

1. **Open an issue first** for anything beyond a bug fix or typo. Brass-Monkey has
   opinionated architecture (see below) and it is disappointing for everyone when
   a large PR has to be rejected on shape rather than substance.
2. Fork, then branch from `main`. Name it for the change: `fix/write-record-zod`,
   `feat/aggregate-groupby`.
3. Make your change, with tests.
4. `npm test` must pass. Please also run `npm run build`, then reset `dist/` as
   above.
5. Open the pull request against `main` and fill in the template.

`main` is protected: it requires a passing test matrix on Node 18/20/22, the
Contributor Guard check, and review from a code owner. Maintainers merge; please
don't be discouraged by a delay.

## Local setup

```bash
npm ci                # use `ci`, not `install` — respects the lockfile
npm test              # vitest, mock-based, no Odoo instance needed
npm run test:watch
npm run build         # tsc + ncc bundle + .mcpb — rewrites dist/, see rule 1
```

`npm test` is fully mocked and is the canonical suite. To exercise a real Odoo
instance, create a gitignored `.env` with `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`,
`ODOO_API_KEY`, then `./start-inspectors.sh --dev`. Note that
`tests/live-diagnostics.ts` and `tests/test-error-diagnostic.ts` hit a live
instance, are **not** part of `npm test`, and some reference renamed tools — treat
the `tests/*.test.ts` suite as authoritative.

**Never commit credentials.** `.env` is gitignored; keep it that way. Secret
scanning with push protection is enabled on this repository and will block a push
containing a recognised credential.

## Architecture you need to know

Request flow: **MCP client → `src/mcp-server.ts` → tool handler (`src/tools/`) →
services (`src/services/`) → Odoo XML-RPC.**

### Two schemas per tool — the most common mistake

Every operational tool has **two** schemas that must be kept in sync:

1. A **static JSON schema** in `src/tools/schemas.ts`, used for MCP tool
   *discovery*. It is hand-written deliberately, to avoid bundling
   `zod-to-json-schema` into the runtime bundle.
2. A **Zod schema** co-located in the tool file, enforced with `.parse()` inside
   the handler at runtime.

If you change a tool's parameters, **update both.** Changing only the Zod schema
produces a tool that advertises the wrong interface to agents; changing only the
JSON schema produces one that rejects the calls it just advertised.

### Adding a tool

1. Implement it in `src/tools/`.
2. Export it from `src/index.ts`.
3. Add its static JSON schema to `src/tools/schemas.ts`.
4. Register it in the `toolRegistry` in `src/mcp-server.ts`, including `deps`,
   which drives dependency injection: `'manager'` → `handler(instanceManager, args)`,
   `'config'` → `handler(configStore, args)`, `'both'` →
   `handler(configStore, credentialStore, args)`.

### Conventions

- **TypeScript strict mode**, ESM with `NodeNext` resolution — source imports use
  `.js` extensions (`import { foo } from './foo.js'`) even though the source is
  `.ts`. This is required, not a typo.
- **Zod for all** tool parameters and Odoo response validation.
- **Async** for every RPC call.
- **Prefer structural fixes over guards.** If an agent misuses a tool, the first
  question is whether the guidance in `skills/` or the tool description is wrong,
  not whether the tool should refuse the call. Please don't submit PRs that
  hard-code restrictions to paper over confusing metadata.
- **Zero-log policy:** never log Odoo tokens, passwords, or sensitive record data.
- **Write guards:** state-changing tools require an explicit `justification`,
  recorded to `ir.logging` and the record's Chatter. Don't add a mutating tool
  without one.
- `skills/` uses the Anthropic Agent Skills format (`SKILL.md` with
  `name`/`description` frontmatter plus `resources/`). Match the existing shape.

## Security issues

Please **do not** open a public issue or PR for a vulnerability — see
[SECURITY.md](SECURITY.md) for the private reporting channel.

## Licence

Contributions are accepted under the [MIT Licence](LICENSE).
