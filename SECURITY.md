# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

OpenCanva is pre-1.0; security fixes land on the latest `0.1.x` release of
`@opencanva/core`.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for a
vulnerability.

Use GitHub's **[private vulnerability reporting](https://github.com/daniellee-ux/open-canva/security/advisories/new)**
(the *Report a vulnerability* button on the repository's **Security** tab). We aim
to acknowledge reports within a few days and will coordinate a fix and disclosure
with you.

## Scope & threat model

OpenCanva is a **local, dev-time authoring tool**, not a deployed service — that
shapes what's in scope:

- `opencanva dev` exposes write endpoints under `/__ox/*` that **mutate files on
  the developer's machine** (the click-to-source inspector, asset upload/rename,
  design / board / token edits). These exist **only in the dev server**
  (`apply: 'serve'`) — they are **not** part of `opencanva build` or the
  production bundle.
- Those endpoints are guarded: they require a **same-origin** request plus a
  custom write header (or a JSON content-type for the inspector API), so an
  arbitrary third-party page can't drive them cross-origin. They're meant to be
  reached only by the OpenCanva app itself, on `localhost`.

**In scope** — please report:

- Path traversal, missing/weak write-guards, or unvalidated input written to disk
  via any `/__ox/*` endpoint.
- Issues in `@opencanva/core` (runtime, Vite plugins, CLI, inspector write-back,
  asset handling) that let a same-origin page or a malicious design escalate
  beyond the intended dev-tool surface.
- The `opencanva init` scaffolder or a vendored skill shipping something unsafe.

**Out of scope** — generally:

- Third-party dependencies — report those upstream (we'll bump once fixed).
- A user's own design code (designs are arbitrary React you author and run
  locally).

When in doubt, report it — we'd rather triage a non-issue than miss a real one.
