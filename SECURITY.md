# Security Policy

Brass-Monkey is an MCP server that holds credentials for, and performs writes
against, live Odoo instances. A vulnerability here can expose an organisation's
ERP data. Please report suspected issues privately rather than opening a public
issue.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/actinon-com/brass-monkey/security/advisories/new)**
— or navigate to the repository's **Security** tab → **Report a vulnerability**.

This opens a private advisory visible only to you and the maintainers. If that
form is unavailable to you, open a public issue containing *no technical detail*
— just a request for a private channel — and a maintainer will follow up.

Please do **not** report vulnerabilities via pull request, since the fix and the
description of the flaw become public before a release is available.

## What to include

- The version affected (`npm ls brass-monkey`, or the `version` field in
  `package.json`).
- Odoo major version and deployment shape (Odoo.sh / on-premise / Docker), since
  much of this codebase branches on Odoo schema differences.
- Which MCP host was in use (Claude Code, Claude Desktop, Gemini CLI, Antigravity).
- Reproduction steps, and the impact you believe is achievable.

**Redact real credentials and real business data.** Do not paste API keys, live
URLs, database names, or customer records into a report — reproduce against a
scratch database, or describe the shape of the data instead. If you believe a
credential has already been exposed, rotate it in Odoo before reporting.

## Scope

Areas where a report is especially valuable:

- **Credential handling** — `src/services/credential-store.ts`. Resolution order
  is OS keychain → AES-256-GCM encrypted local file → environment variable.
  Weaknesses in the encrypted-file path, key derivation, or file permissions are
  in scope.
- **Credential or record leakage into logs**, error messages, or MCP responses.
  The project operates a zero-log policy for tokens, passwords, and sensitive
  record data; any path that violates it is a valid report.
- **Write-guard bypass** — state-changing tools require an explicit
  `justification` that is recorded to `ir.logging` and the record's Chatter.
  A way to mutate Odoo data without producing that audit trail is in scope.
- **Audit tampering** — `src/services/audit-service.ts`, including the local
  `audit.jsonl`.
- **Domain-validator bypass** — `src/services/domain-validator.ts`, where a
  crafted domain reaches Odoo in a form the validator was expected to reject.
- **The distributed bundle** — `dist/bundle/index.js` is a committed artifact
  executed directly by MCP hosts. Reports of a mismatch between it and `src/`
  are treated as potential supply-chain issues and prioritised.
- **Supply chain** — a dependency shipping into the bundle with a known
  advisory.

Generally **out of scope**:

- Vulnerabilities in Odoo itself — report those to
  [Odoo](https://www.odoo.com/security-report).
- An MCP host granting the agent more Odoo permission than intended: Brass-Monkey
  acts with the permissions of the configured Odoo user by design. Configure a
  least-privilege Odoo user for agent use.
- Missing hardening that requires the attacker to already have local filesystem
  or process access to the machine running the server.

## Response

This is a small project, so please allow reasonable time. We aim to acknowledge
a report within a week, and to agree a disclosure timeline with you once the
issue is confirmed. Credit is given in the advisory and release notes unless you
prefer otherwise.

## Supported versions

Fixes land on the latest minor release line only. There is no long-term support
branch — please upgrade before reporting.
