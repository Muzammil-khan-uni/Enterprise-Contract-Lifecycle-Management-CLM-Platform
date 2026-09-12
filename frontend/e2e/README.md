# End-to-end tests (Playwright)

Real, runnable Playwright specs against a full running stack (real
browser, real frontend, real backend, real database) — **none of
these have actually been executed.** This file says so plainly, same
as `/load-testing/README.md`, rather than presenting untested specs
as if they'd been verified.

## Why nothing here has been run

`npx playwright install chromium` was attempted and failed:

```
Error: Download failed: server returned code 403 body 'Host not in
allowlist: cdn.playwright.dev. Add this host to your network egress
settings to allow access.'
```

This sandbox's network is allowlisted to package registries and
GitHub only — no browser-binary CDN, and (same as the load-testing
gap) no reachable MongoDB/Redis to run a real backend against even if
a browser were available. `@playwright/test` itself installed fine
(it's on npm), so the specs below are syntactically real and were
written against the actual current DOM/selectors in the app's source
— but "written correctly" and "verified by actually running" are not
the same claim, and only the first one is true right now.

## A real bug this surfaced before a single test ran

Writing these specs required using `page.getByLabel(...)` — Playwright's
(and a screen reader's) standard way to find a form control by its
visible label. That only works when a `<label>` is programmatically
associated with its input via `htmlFor`/`id` (or the label wraps the
input). A grep across the app found:

```
13 files use <label>
0 of them use htmlFor
```

That's not a one-off — it was the consistent pattern across the
entire app. This is a genuine WCAG failure (1.3.1 Info and
Relationships / 4.1.2 Name, Role, Value), not just a test-authoring
inconvenience: a screen reader user hitting any of these forms had
the same "which field is this?" ambiguity Playwright's `getByLabel`
was tripping on.

**Update: fixed, all 13 files.** Every `<label>` in the app now has a
matching `htmlFor`/`id` pair (`LoginPage.tsx` was fixed first, since
the shared login helper every spec depends on needed it; the
remaining 12 — VendorsPage, UsersPage, ResetPasswordPage,
ForgotPasswordPage, TemplatesPage, ClauseLibraryPage,
InitiateSignatureForm, VersionRangeCompare, ContractCreatePage,
CreateObligationForm, BusinessUnitsPage, DepartmentsPage — were fixed
in a follow-up pass). `contracts.spec.ts` and `business-units.spec.ts`
still use `name`-attribute selectors rather than `getByLabel` for the
pages they were originally written against — both approaches are
equally valid now that the labels are fixed, and the existing
selectors were left as-is (already verified parsing correctly via
`playwright test --list`) rather than churned for parity alone.

## How to actually run these

```bash
# 1. Real Mongo + Redis (plus real SMTP and DocuSign/Adobe Sign
#    credentials in backend/.env — see README.md's "Real
#    integrations, no mocks" section; the backend won't boot without
#    them)
docker-compose up -d mongo redis

# 2. Start both servers
cd backend && npm run dev            # backend, in one terminal
cd ../frontend && npm run dev        # frontend, in another

# 3. Install browser binaries (needs real network access to
#    cdn.playwright.dev — not available in this sandbox)
npx playwright install chromium

# 4. Run — globalSetup (e2e/global-setup.ts) bootstraps the acme
#    tenant, admin login, and a business unit/department through the
#    backend's real API before any spec runs. No seed script.
npm run test:e2e
```

## What's covered

- `auth.spec.ts` — login success/failure/validation, unauthenticated
  redirect
- `register.spec.ts` — self-service organization sign-up: slug
  auto-derivation, password-strength validation, landing signed-in on
  success, and the Login ↔ Register cross-links
- `contracts.spec.ts` — contract creation (incl. the business-unit →
  department cascading select), required-field validation, list
  filtering
- `business-units.spec.ts` — create, inline edit, and the delete
  orphan-guard actually blocking deletion in the UI (not just at the
  API level — see `BusinessUnitsPage.deleteGuard.test.tsx` in the
  Vitest suite for the component-level version of this same check)

Not covered yet: approvals, signature, obligations, templates/clause
library, users/vendors admin, notifications. These four specs were
chosen to cover the highest-value paths (auth is the front door,
registration is the only way in from zero, contracts are the core
domain object, business units exercise the admin-CRUD pattern shared
by five other modules) rather than attempt exhaustive coverage with
zero verified runs backing any of it.
