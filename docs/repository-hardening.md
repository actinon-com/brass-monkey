# Repository Hardening for Public Contributions

Maintainer-facing record of how `main` is protected and why, set up when the
repository was opened to public fork pull requests. Read this before changing
branch protection — the two layers below are deliberately separate and collapsing
them reintroduces a problem.

## The problem being solved

A sole maintainer cannot both *require* an approving review and merge their own
work: GitHub forbids self-approval, so "1 approval required" plus "no bypass"
means nothing on `main` is ever mergeable. But leaving review unenforced means an
outside contributor's pull request has no gate.

The resolution is two independent layers with different bypass rules.

## Layer 1 — classic branch protection (no bypass, applies to everyone)

Unchanged from before this work; it already did this job and is proven across the
repository's merge history.

| Setting | Value |
|---|---|
| Require a pull request before merging | yes |
| `enforce_admins` ("Include administrators") | **true** |
| `required_approving_review_count` | 0 |
| `require_code_owner_reviews` | true |
| `allow_force_pushes` / `allow_deletions` | false / false |
| Required status checks (`strict: true`) | `test (18.x)`, `test (20.x)`, `test (22.x)`, `Contributor guard` |

Because `enforce_admins` is true and there are no push restrictions to bypass,
**nobody can push directly to `main` — including the repository owner.** This is
what makes the "never commit directly to `main`" rule in `CLAUDE.md`
machine-enforced rather than merely documented. Do not turn `enforce_admins` off
to solve a review problem; that is what Layer 2 exists for.

The review count is deliberately left at **0** here so that this layer can never
deadlock the maintainer.

## Layer 2 — ruleset `main: review required` (maintainer bypasses)

Ruleset ID **20434049**. Carries the entire review policy:

| Parameter | Value |
|---|---|
| `required_approving_review_count` | 1 |
| `require_code_owner_review` | true |
| `require_last_push_approval` | true |
| `dismiss_stale_reviews_on_push` | true |
| `required_review_thread_resolution` | true |
| `allowed_merge_methods` | `merge`, `squash` |

Bypass: `OrganizationAdmin` with `bypass_mode: always`. Bypass in GitHub rulesets
is **per-ruleset, not per-rule**, which is precisely why the direct-push block
lives in Layer 1 — granting bypass here does not grant permission to push directly
to `main`.

Net effect:

- **Outside contributor's PR** — needs an approving review from a code owner
  (`* @matty-drexler`), review threads resolved, and no unapproved push after
  approval.
- **Maintainer's own release PR** — bypasses Layer 2 and merges without a second
  approver, but still cannot skip Layer 1, so it must still be a PR with green
  checks.

### Expected UI oddity, not a fault

A maintainer's PR shows `mergeStateStatus: BLOCKED` and
`reviewDecision: REVIEW_REQUIRED` even though it is mergeable. That is display
only — `GET /repos/{owner}/{repo}/rules/branches/main` is documented to return all
active rules "regardless of the level at which they are configured" and does not
subtract rules the caller can bypass. To confirm bypass is live:

```bash
gh api repos/actinon-com/brass-monkey/rulesets/20434049 -q '.current_user_can_bypass'
# => "always"
```

Note this field is only populated on the **single-ruleset** endpoint; the list
endpoint returns `null` for it.

### The code-owner gate is real — verified, not assumed

When this repository was first audited, the review requirement was
`required_approving_review_count: 0` plus `require_code_owner_reviews: true`, and it
was **unknown** whether that combination actually blocked a pull request from
someone other than the code owner. Every PR in the repository's history up to that
point had been authored by the sole code owner, so the third-party path had never
been exercised. It has now been, by Dependabot:

| PR author | `gh pr merge --admin` | Why |
|---|---|---|
| `matty-drexler` (e.g. #48) | **succeeds** | The sole code owner cannot review their own PR, so the requirement is unsatisfiable and the admin override is permitted. |
| `dependabot[bot]` (e.g. #41) | **refused** — "Waiting on code owner review from matty-drexler" | A real approval *is* obtainable, so GitHub will not let an admin override it. |

Two consequences worth internalising:

1. **Outside contributions were already gated**, even before ruleset 20434049 was
   added. The ruleset raises the bar to an explicit approving review; it did not
   create the gate.
2. **`--admin` is not a universal skeleton key.** It only bypasses requirements
   that cannot be satisfied. Any PR authored by someone else — a contributor,
   Dependabot, a second maintainer — needs a genuine approving review, and no flag
   substitutes for it. Plan releases accordingly: bot PRs need a click.

### Merging a queue of PRs

`required_status_checks.strict` is `true`, so every PR must be up to date with
`main` before it can merge, and each merge staleness-invalidates the rest of the
queue. Merging several PRs is therefore inherently sequential:

```bash
gh pr update-branch <n>          # rebase onto current main
gh pr checks <n> --watch         # wait for the matrix + Contributor guard
gh pr merge <n> --squash --delete-branch
```

### If the ruleset ever does block you

```bash
# add yourself explicitly (5282054 = matty-drexler)
gh api -X PUT repos/actinon-com/brass-monkey/rulesets/20434049 \
  -f 'bypass_actors[][actor_type]=OrganizationAdmin' \
  -f 'bypass_actors[][bypass_mode]=always'

# or remove the layer entirely, reverting to Layer 1 only
gh api -X DELETE repos/actinon-com/brass-monkey/rulesets/20434049
```

Deleting the ruleset restores the exact pre-hardening state, since Layer 1 was
never modified.

## Layer 3 — Contributor Guard workflow

`.github/workflows/contributor-guard.yml`, a required status check. Two gates,
both applying to fork pull requests only:

1. **No changes to `dist/`.** `dist/bundle/index.js` is a committed artifact *and*
   the file MCP hosts execute. The test suite runs `npm run build` before
   `npm test`, so a poisoned bundle would be overwritten in CI, pass every check,
   and still ship on merge — and a minified diff is not reviewable. The
   discriminator is fork-vs-same-repo rather than path alone, so maintainer
   release branches, which legitimately rebuild `dist/`, are unaffected.
2. **DCO sign-off** on every commit. Provenance only; MIT plus GitHub's
   inbound=outbound already covers the licence grant, so there is no CLA.

The job has **no job-level `if:`** and always runs, deciding pass/fail internally.
This is load-bearing: a skipped job leaves a required status check pending forever
and makes the PR permanently unmergeable. If you add gates here, preserve that
property.

## Other settings applied

- Secret scanning: **enabled**. Push protection: **enabled**.
- Dependabot security updates and vulnerability alerts: **enabled**;
  `.github/dependabot.yml` adds weekly grouped npm + github-actions updates.
  `@vercel/ncc` is excluded from grouping and pinned against minor/major bumps,
  because it is the bundler that produces the shipped artifact — see the comment
  in that file for the incident that prompted it.

  **Consequence of the committed-artifact model:** merging a dependency PR updates
  `package.json` and the lockfile but *not* `dist/bundle/index.js`. A dependency
  fix therefore does not reach users installing from the repo or a tag until a
  release rebuilds the bundle. Factor this into release timing when an advisory
  actually affects shipped code.
- Rebase merges disabled; squash and merge-commit retained. Merge commits are kept
  deliberately — the release-branch pattern depends on them — so squash is a
  per-PR choice for contributor branches rather than forced repo-wide.
- Delete branch on merge: enabled.
- CI uses `npm ci`, not `npm install`, so the committed lockfile is authoritative.

- Fork PR workflow approval: **`all_external_contributors`**. Every fork PR now
  needs a maintainer to authorise its workflow run, not just first-timers.
  Contrary to what the UI implies, this *is* scriptable — the endpoint is easy to
  miss because it is not under `actions/permissions` proper:

  ```bash
  gh api repos/actinon-com/brass-monkey/actions/permissions/fork-pr-contributor-approval
  # => {"approval_policy":"all_external_contributors"}

  gh api -X PUT repos/actinon-com/brass-monkey/actions/permissions/fork-pr-contributor-approval \
    -f approval_policy=all_external_contributors
  ```

  Valid values are `first_time_contributors_new_to_github`,
  `first_time_contributors` (the default) and `all_external_contributors`. Prefer
  the API over the UI here: the setting is easy to believe you have saved when you
  have not, and the `GET` above is the only reliable confirmation.

  Underlying exposure was already low — the test workflow uses `pull_request` not
  `pull_request_target`, there are zero repo Actions secrets, and the default
  workflow token is read-only — so this closes compute abuse and a fork PR
  introducing a third-party action.

## Outstanding — not achievable on this plan

**Secret scanning extras.** `secret_scanning_non_provider_patterns` and
`secret_scanning_validity_checks` both refuse to enable via the API and remain
disabled. These belong to **GitHub Secret Protection**, a paid add-on, which is
why there is no free-tier toggle for them; the correct UI location is
**Settings → Security → Advanced Security → Secret Protection** (the section was
formerly called "Code security and analysis", so older instructions naming a "Code
security" group are stale).

This is a nice-to-have, not a gap. The two features that matter — secret scanning
and **push protection**, the one that actually blocks a credential at push time —
are both enabled and are free on public repositories.

## Known broken, deliberately untouched

`npm run lint` **exits 127.** The script runs `eslint src/**/*.ts`, but `eslint` is
not in `devDependencies` and no eslint config exists anywhere in the repository —
the script is vestigial. It is therefore *not* wired into CI; adding it would have
broken CI immediately. Fixing it means choosing a config (likely
`typescript-eslint`) and resolving whatever it flags across `src/`, which is its
own change.
