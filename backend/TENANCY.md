# Multi-Tenant SaaS — Design Notes

Bonus challenge from the original brief. This document explains the
mechanism, what's scoped and what deliberately isn't, and where the
line was drawn on testing given this sandbox has no live MongoDB to
run the actual query-time hooks against.

## The mechanism

Two pieces, both in `src/core/tenancy/`:

- **`tenant-context.ts`** — a Node `AsyncLocalStorage` holding the
  current request's tenant id, set once per request. Using
  `AsyncLocalStorage` rather than a plain module-level variable is
  what makes this safe under concurrency: two requests for two
  different tenants running at the same time (normal at 25,000
  concurrent users) get correctly isolated contexts even though
  they're interleaved on the same event loop. Proven directly —
  `tenant-context.test.ts`'s "isolates concurrent contexts from each
  other" test fires two `runWithTenant` calls with different delays
  and asserts each still sees its own tenant id.
- **`tenant-scope.plugin.ts`** — a Mongoose schema plugin. Every
  tenant-owned model calls `.plugin(tenantScopePlugin)`. It does two
  things automatically, with no per-repository code required:
  1. **Writes**: stamps `doc.tenant` from the current context onto
     any new document that doesn't already have one, at `pre('validate')`
     time (before Mongoose's own `required: true` check on the field
     runs). If no context exists when a new document needs one, it
     throws — loudly, not silently — because that only happens if a
     route was wired without going through `auth.middleware.ts`.
  2. **Reads**: injects `{ tenant: currentTenantId }` into every
     `find`-family query, `aggregate` pipeline, and `countDocuments`
     call, automatically. A repository method that forgets to filter
     by tenant still can't leak another tenant's data — the filter
     is applied at the schema level, not opted into per query.

`auth.middleware.ts` is the one place `runWithTenant(...)` gets
called — right after JWT verification, wrapping the rest of the
middleware/handler chain. Everything downstream (controllers,
services, repositories, Mongoose) inherits that context automatically
through Node's async propagation; nothing else needed to be touched.

## What's tenant-scoped, and what isn't (both on purpose)

**Scoped** (via the plugin): `Contract`, `Vendor`, `Department`,
`BusinessUnit`, `Template`, `Clause`, `ApprovalWorkflow`, `Obligation`,
`AuditLog`. These are the models an organization's own data actually
lives in — including `AuditLog`, deliberately: one tenant's admin
should never see another tenant's audit trail either.

**Not scoped**:
- **`Tenant` itself** — it IS the scoping unit; asking "which tenant
  does this Tenant belong to" doesn't make sense.
- **`User`** — has a `tenant` field (required, set at registration)
  but does NOT use the plugin. Login has to look a user up by email
  *before* any tenant context can exist — there's nothing to scope by
  yet at that point in the request, so the plugin's mechanism (which
  depends on context already existing) can't apply here regardless of
  the uniqueness model chosen.

  **Update**: `email` is now unique per-`{tenant, email}`, not
  globally — closed after initially being documented here as a
  deliberate simplification. Closing it required the
  tenant-disambiguation step flagged above: login now takes a
  `tenantSlug` alongside email/password (`POST /auth/login`), the
  same way registration already did, and `userRepository.findByEmail`/
  `findByEmailWithPassword` both take a `tenantId` parameter now.
  Verified in `tests/unit/login-tenant-scoping.test.ts`, including the
  case that matters most: the same email logging into two different
  tenants resolves to two different user documents. The frontend
  `LoginPage` gained an "Organization" field to collect the slug — see
  that file's comment for why a subdomain-based approach
  (`acme.clm-platform.com`) would be the more typical production
  pattern, deferred here as needing DNS/hosting setup outside this
  project's scope rather than a form field.
- **Read-only background jobs** (the reminder-scan scheduler, the
  notification worker) — these run with no request and therefore no
  tenant context. The plugin's read hooks treat "no context" as "this
  is a system operation, don't scope" rather than throwing — a daily
  sweep that checks every tenant's expiring contracts is supposed to
  see every tenant. This is the one deliberately permissive case, and
  it only ever applies to reads; the write-side throws instead of
  guessing when there's no context.

## Registration and login — the `tenantSlug` field

Both endpoints now need to know which organization they're operating
against, for related but distinct reasons:

- `POST /auth/register` requires `tenantSlug` on its anonymous
  bootstrap path (creating a brand-new tenant's first user) — see the
  registration-gating writeup in the root `README.md` for the full
  two-path rule (anonymous-bootstrap-only-if-zero-members vs.
  authenticated-Admin-adding-a-teammate). The Phase 1 concern that
  originally motivated flagging this file's registration section —
  self-service role selection being wide open — is closed; not just
  deferred as "still true" the way an earlier version of this
  document said.
- `POST /auth/login` requires `tenantSlug` because email is unique
  per-`{tenant, email}`, not globally (see above) — the tenant is
  what disambiguates which of possibly-several same-email users a
  login means.

Creating new tenants themselves is gated to `USER_MANAGE` (Admin-only)
at `POST /tenants`.

## Password reset and email verification tokens — deliberately NOT tenant-scoped

`findByPasswordResetToken` and `findByEmailVerificationToken`
(`user.repository.ts`) search across all tenants, unlike every other
`User` lookup in this codebase. This is intentional, not a gap: the
32-byte random token itself (see `secure-token.util.ts`) is already
the credential that identifies which user a request means — requiring
a tenant to be supplied alongside it would add no real security
benefit (the token's entropy already makes it the sole meaningful
identifier) and would only complicate the emailed link itself, which
would otherwise need to embed the tenant slug too for no gain.

## Testing — what was verified, and what wasn't

**Verified**: the `AsyncLocalStorage` mechanism itself
(`tenant-context.test.ts`, 5 tests including the concurrency-isolation
case above), every model file's type-correctness (`tsc --noEmit`
passes clean with `tenant: Types.ObjectId` added to every scoped
model's interface), and the full login disambiguation flow
end-to-end at the application layer (`login-tenant-scoping.test.ts`,
4 tests) — including the specific case that the whole per-tenant
uniqueness change exists to handle: the same email resolving to two
different user documents depending on which tenant is supplied.

**Not verified, and why**: the Mongoose plugin's actual query-time
behavior on the tenant-owned models — that a `Contract.find()` call
really does get `{tenant:...}` injected, that a save really does
throw without context — requires a live MongoDB connection to
exercise Mongoose's real hook pipeline against. This sandboxed
environment has no MongoDB server available (the same limitation
noted in `HARDENING.md` for load testing). The login tests above
verify the same *kind* of claim (tenant-based data isolation) but for
`User`, which is looked up with an explicit `{email, tenant}` filter
in ordinary repository code — not through the plugin's automatic
query-injection mechanism, which is what still lacks a live-database
test. Anyone picking this up with a real database available should
add an integration test that creates two tenants, creates a contract
under each, and asserts a `Contract.find()` running inside one
tenant's context never returns the other's document — that's the
specific gap this sandbox couldn't close.

