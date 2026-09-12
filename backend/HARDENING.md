# Hardening Review

Findings and changes from the security/performance pass over Phases 1–6,
plus what changed at the Express 5 upgrade, the auth/security checklist
review, and the dependency-update pass below. Everything below was
verified against the running test suite (103 passing tests) rather
than asserted from memory.

## Dependency update pass: a real CVE and two long-broken tools, not just cosmetic warnings

Triggered by a routine `npm install` surfacing deprecation warnings.
What looked like housekeeping turned up two things worth flagging
directly rather than treating as routine:

- **`multer@1.4.5-lts.x` (the version this project shipped with) has
  real, high-severity CVEs** — CVE-2025-47935 and CVE-2025-47944/
  CVE-2025-7338, both denial-of-service: a single malformed multipart
  upload can crash the entire Node process with an unhandled
  exception. `npm audit` did not flag this — it was found by
  independently researching the deprecation warning rather than
  trusting a clean audit result. Fixed by upgrading to `multer@2.2.0`;
  this codebase's actual usage (memory storage, single-file uploads,
  reading `req.file` in the controller) is exactly the pattern the
  migration guide describes as needing no code changes, confirmed
  before upgrading, not assumed after.
- **`npm run lint` has never actually worked in this project, on
  either side, until this pass.** The backend's `.eslintrc.json`
  referenced `@typescript-eslint/parser` as a config value without
  that package ever being listed as a dependency — every invocation
  failed at "Cannot find module" before linting a single file. The
  frontend had no ESLint config file at all. Both were silently
  broken since Phase 0/Phase 1 respectively and nobody — including
  this project's own extensive test-and-verify discipline — had
  actually run `npm run lint` to notice, because verification focused
  on `tsc` and the test suite, and lint was never in that loop. Fixed
  properly as part of the ESLint 8→10 upgrade (both sides now use
  flat config — `eslint.config.mjs` on the backend, forced to ESM
  since the backend's `package.json` has no `"type": "module"`;
  `eslint.config.js` on the frontend, which already does) — and
  running the newly-working linters immediately found two more real,
  if minor, issues (an unused import, a dead parameter) that had been
  invisible the whole time. Both fixed.
- The **transitive** deprecation warnings (`inflight`, old `glob`,
  `rimraf`, `@humanwhocodes/*`) were symptoms of ESLint 8's own
  dependency tree and Jest 29's coverage-instrumentation chain, not
  anything this project depends on directly — resolved by the ESLint
  10 and Jest 30 upgrades, plus one targeted `overrides` entry
  (`test-exclude` pinned to `^8.0.0`) for a package nested inside
  Jest's `babel-plugin-istanbul` dependency that hadn't been bumped
  by its parent yet. That override only affects test-time coverage
  instrumentation — never shipped in the production build — and was
  verified safe by actually running `npx jest --coverage` and
  confirming real per-file percentages came back, not just that
  install succeeded.
- **`glob@10.5.0` (via Jest 30's own core packages —
  `@jest/reporters`, `jest-config`, `jest-runtime`) required a second,
  riskier `overrides` entry** — this glob usage is Jest's actual
  test-discovery and config-loading machinery, not a side path like
  `test-exclude` above, so forcing it to a newer major (`^13.0.6`, a
  3-major jump) had real potential to silently break test discovery
  rather than crash loudly. Verified specifically for this risk: ran
  the full 103-test suite (all 25 suites still discovered, same count
  as before the override) and `npx jest --coverage` separately
  (`@jest/reporters` is one of the three packages using this glob
  directly, and coverage output came back with correct real per-file
  percentages) before trusting the override.
- **`cron-parser@4.9.0` (via `bullmq@5.81.3`) — the item flagged in an
  earlier pass of this same review as "deliberately left as-is" — is
  now fixed for real.** Revisited after being pushed on rather than
  accepting the earlier deferral, and it turned out the earlier
  reasoning ("can't verify without live Redis") was too pessimistic:
  proper research surfaced BullMQ's own v5→v6 migration guide, which
  states plainly that v6 REMOVED the legacy repeatable-job storage
  format this app's reminder-scan scheduler used
  (`core/scheduler/scheduler.ts`'s old `queue.add(name, data,
  { repeat: {...} })` form) — a v6 worker encountering that old
  format in Redis raises an error rather than degrading gracefully.
  That's concrete, actionable information, not a reason to give up:
  rewrote `scheduler.ts` to use BullMQ's current `upsertJobScheduler`
  API instead. Verified as thoroughly as this sandbox allows: a clean
  `tsc` against BullMQ v6's real shipped types (a signature mismatch
  in the new API call would have failed to compile), the full test
  suite still passing, and the server's own startup sequence
  confirmed to fail at the expected point — the Mongo connection
  attempt, same as before this change — rather than crashing earlier
  inside BullMQ's own import or Worker-construction path. What
  remains genuinely unverifiable without a live Redis cluster: the
  actual scheduled-job execution behavior at runtime. `DEPLOYMENT.md`
  has a dedicated section on the one real operational step this
  upgrade requires for an ALREADY-RUNNING v5 deployment specifically
  (clearing old repeatable-job metadata from Redis before deploying
  this version) — a fresh deployment is unaffected.
- `recharts@2.15.4` (frontend) was also flagged deprecated (v3 is
  now the only maintained line). Checked this app's two chart
  components against recharts' own 3.0 migration guide's list of
  actual breaking changes (`activeIndex`, `alwaysShow`, `isFront`,
  direct internal-state access) before upgrading — none are used
  anywhere in this codebase, matching the migration guide's own
  assessment that basic chart usage needs no changes. Upgraded to
  `recharts@3.10.1`, verified with a clean `tsc` and a clean
  `vite build`.
- Fixing the frontend's ESLint setup for real (not just installing a
  newer version) meant choosing an actual ruleset, not leaving it
  empty — added `eslint-plugin-react-hooks` and
  `eslint-plugin-react-refresh`, which immediately caught a genuine
  anti-pattern in `VerifyEmailPage.tsx` (`setState` called
  synchronously inside an effect for a value — "no token in the URL"
  — that was already knowable at render time, causing one avoidable
  extra render on every token-less visit). Fixed by deriving that
  case directly instead of routing it through `useEffect` +
  `useState`. A second warning (react-hook-form's `watch()` being
  incompatible with React Compiler's auto-memoization) was reviewed
  and left as an understood, documented tradeoff rather than a bug —
  the component still behaves correctly, it just doesn't get
  compiler-driven memoization, which doesn't matter for a form this
  small.

## Auth checklist: forgot/reset password, email verification, account lockout

Added in response to an explicit checklist review that found these
four items — listed as expected core features — genuinely absent, not
partially built. Full design rationale lives in each flow's own
docstring (`auth.service.ts`); this section is the security-property
summary.

- **No user enumeration via forgot-password.** The single most
  important property this endpoint has: it must behave identically
  whether or not the submitted email/organization matches a real,
  active account — same response, same timing profile as far as this
  codebase controls it, no distinguishable branch. Verified with
  tests asserting the "no match" path resolves with no email sent and
  no error, for three different kinds of non-match (unknown tenant,
  unknown email, deactivated account) — not just for the success
  case.
- **Reset tokens are single-use, time-limited, and never stored in
  plaintext.** A 32-byte `crypto.randomBytes` token is emailed to the
  user; only its SHA-256 hash is persisted (`secure-token.util.ts`) —
  a database read (backup leak, insider access) can't yield a usable
  token. Deliberately SHA-256, not bcrypt: bcrypt's slow, salted
  design defends low-entropy human-chosen secrets against offline
  brute-forcing, which a 256-bit random token doesn't need, and a
  fast deterministic hash is what allows a direct indexed lookup
  instead of scanning every outstanding token.
- **A successful password reset invalidates every existing session**,
  not just accepts the new password — `tokenVersion` is bumped (the
  same "logout everywhere" mechanism `POST /auth/logout-all` uses)
  and the Redis-tracked refresh-token set is cleared. Reasoning: a
  password reset via a genuinely emailed, single-use token is
  strong-enough evidence of a compromise-response scenario to justify
  killing other sessions outright, not just changing the password
  going forward.
- **Account lockout checks run BEFORE password verification, not
  alongside or after it** — proven with a test that submits the
  *correct* password against a locked account and confirms it's
  still rejected (`account-lockout.test.ts`). The failed-attempt
  counter uses an atomic `findByIdAndUpdate` with `$inc`
  (`user.repository.ts`'s `incrementFailedLoginAttempts`) specifically
  to stay race-safe under concurrent wrong-password attempts — a
  read-then-increment-then-write pattern would let two simultaneous
  requests each read count=4, each increment to 5, and each
  independently (and wrongly) conclude the account isn't locked yet.
- **`forgot-password` has its own, tighter rate limiter** (5 per 15
  minutes) than even login's — it triggers a real outbound email per
  request and always returns success regardless of match, which makes
  a generous limit a spam/inbox-flooding vector in a way login's
  limiter doesn't need to worry about.
- **Real email delivery is required, not optional** — see README.md's
  "Real integrations, no mocks" section. SMTP credentials are
  validated at boot (`config/env.ts`); there is no console-logging
  fallback any more. See DEPLOYMENT.md's "Email" section.

## Platform superadmin: a real cross-tenant data-exposure fix, not just a gap

Found during a requirements-compliance pass, not a routine review:
`GET/POST /tenants` — the one pair of endpoints in the system that
legitimately reads/writes across every organization on the platform,
since `Tenant` is the one model NOT covered by `tenantScopePlugin`
(see `tenant.model.ts` / `core/tenancy/tenant-scope.plugin.ts`) — was
gated with `requirePermission(Permission.USER_MANAGE)`. USER_MANAGE
is an ordinary tenant-scoped permission that any customer's own Admin
role holds by default (`permissions.config.ts`). The practical effect:
**any tenant's own Admin could list every other tenant on the
platform, and create new ones**, with no distinct platform-operator
concept existing anywhere in the system.

Fixed by introducing a trust boundary that is structurally incapable
of being granted through the tenant-scoped role/permission system:

- **`IUser.isPlatformSuperAdmin`** (`user.model.ts`) — a boolean on a
  specific user record, indexed, default `false`. It is not a role,
  not a `Permission`, and cannot be added via `permissionOverrides`
  (a different, unrelated field) — there is no code path anywhere
  that lets a `Permission` value flip this flag.
- **No API route sets it.** The only way it is ever changed is
  `backend/scripts/create-superadmin.ts` (`npm run superadmin --
  grant|revoke|list --email ... --tenant ...`), run directly against
  the database by an operator. It requires the target to already be
  an existing, real user in some tenant (rather than minting a new
  free-floating account), and bumps that user's `tokenVersion` on
  change so an already-issued access token can't keep an old value
  past its next refresh.
- **`core/middleware/platform-superadmin.middleware.ts`** —
  `requirePlatformSuperAdmin` checks the flag directly off the
  verified JWT payload (embedded in `signAccessToken`, same
  statelessness tradeoff as `role`/`permissions`), independent of
  `requirePermission`/RBAC entirely. `tenant.routes.ts` now uses this
  instead of `requirePermission(Permission.USER_MANAGE)`.

Verified with both a unit test
(`tests/unit/platform-superadmin-middleware.test.ts`) proving a token
holding *every* `Permission` in the system — including the old
`USER_MANAGE` gate — is still rejected with 403 unless
`isPlatformSuperAdmin: true`, and an integration test
(`tests/integration/tenant-routes-superadmin-gate.test.ts`) that signs
real JWTs and hits the actual Express app via supertest to confirm the
same at the HTTP layer, plus a 401 for no token and a pass-through
(400 on invalid body, not 403) for a genuine superadmin token.

## Input sanitization

- **NoSQL operator stripping and HTTP Parameter Pollution protection**:
  every route builds a Mongoose filter directly from `req.body` /
  `req.query` / `req.params`. Without this, a crafted body like
  `{"email": {"$ne": null}}` sent to a route that passes fields
  straight into a Mongo query could be interpreted as an operator
  rather than a literal value, and a repeated query key
  (`?status=Draft&status=Approved`) could arrive as an array where a
  handler's Zod schema expects a string. Originally implemented with
  the `express-mongo-sanitize` and `hpp` packages; **replaced at the
  Express 5 upgrade** with a small custom implementation
  (`core/middleware/sanitize.middleware.ts`) after discovering, by
  reading both packages' actual source rather than trusting their
  peerDependency ranges, that neither works correctly under Express
  5's `req.query`, which became a getter with no setter that
  re-parses the URL fresh on every access. `express-mongo-sanitize`
  reassigns `req.query` outright (silently no-ops or throws);
  `hpp` mutates the object `req.query` currently points to, which is
  discarded the moment anything reads `req.query` again — both leave
  query sanitization silently non-functional, not merely absent. See
  that file's docstring for the full account, including why a
  community "Express 5 compatible" fork was evaluated and rejected.
  Proven correct — not just "doesn't throw" — with
  `tests/integration/sanitize-middleware.test.ts`, whose first
  assertion is that a second, independent read of `req.query` later in
  the request returns the exact same sanitized object reference, the
  specific property both original packages silently failed at.
- **Payload size cap**: `express.json({ limit: '2mb' })` was already in
  place since Phase 0 — confirmed still correct; no route needs a larger
  body than that (file uploads go through multer's memory buffer with
  its own size limit in `document.controller.ts`, not through the JSON
  body parser).

## Rate limiting — reviewed, one gap closed

- Global limiter (1000 req / 15 min per IP) — unchanged, appropriate as
  a blunt abuse backstop.
- Login: 10 attempts / 15 min — unchanged, already tight enough for
  brute-force resistance without punishing normal retry-after-typo use.
- **`/auth/register` had no dedicated limiter** — closed this phase (20
  / hour). This does not replace the standing Phase 1 note that
  registration should move behind admin-only `USER_MANAGE` before
  production; it narrows the exposure in the meantime.
- Every other mutating route relies on the global limiter, which is
  appropriate — none of them are password/credential surfaces where a
  tighter bound is warranted.

## Index review — no gaps found, one tradeoff documented

Reviewed every model's indexes against the query patterns actually
issued by its repository/service (not just against the general shape of
the collection):

- `Contract`: compound `{status, expiryDate}`, `{businessUnit, status}`,
  `{department, status}` match the dashboard/list query filters exactly;
  text index on `title` covers search until the Elasticsearch bonus.
- `ApprovalWorkflow`: `{status, slaDeadline}` backs both the approval
  queue and the auto-escalation sweep.
- `Obligation`: `{status, dueDate}` and `{assignedTo, status}` back the
  reminder scan and "my obligations" respectively.
- `AuditLog`: `{entityType, entityId, timestamp}` and `{actor, timestamp}`
  back the two read paths the controller actually exposes.
- `Notification`: `{recipient, status, createdAt}` backs the unread-list
  query.

**One accepted tradeoff, not fixed**: `dashboard.service.ts`'s
`getByDepartment` and `getByVendor` aggregations `$group` over the full
`Contract` collection with no `$match` stage first, so no index changes
the cost — an aggregation without a filtering stage scans regardless.
This is fine today behind the 60s Redis cache, but if department/vendor
breakdowns need to run more often than the cache TTL amortizes at
500K+ contracts, the fix is a denormalized counter (the same pattern
already used for `Vendor.activeContractsCount`), not a new index.

## What was NOT touched this phase

- The two RBAC/signature-provider gaps flagged in Phases 3–4 are still
  open — this was a hardening pass on what exists, not a feature phase.
- No load testing was performed (would require a running Mongo/Redis
  cluster, which this sandboxed environment doesn't have) — the review
  above is a static analysis of query shapes against index definitions,
  not a measured benchmark. Flagging this distinction explicitly rather
  than implying load testing happened.
