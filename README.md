<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=0:1e1b4b,100:6366f1&amp;height=220&amp;section=header&amp;text=Enterprise%20CLM%20Platform&amp;fontSize=38&amp;fontColor=ffffff&amp;animation=fadeIn&amp;fontAlignY=38&amp;desc=Multi-Tenant%20Contract%20Lifecycle%20Management%20for%20the%20Whole%20Organization&amp;descAlignY=58&amp;descSize=15" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;weight=600&amp;size=23&amp;duration=2800&amp;pause=900&amp;color=6366F1&amp;center=true&amp;vCenter=true&amp;width=700&amp;lines=Multi-Tenant+%2B+RBAC+%2B+Async+Approval+Workflows;Elasticsearch+Search+%2B+OCR+%2B+Real-Time+Sockets;E-Signature+Integrations%3A+DocuSign+%2F+Adobe+Sign;TypeScript+End-to-End+%E2%80%A2+103%2B+Passing+Tests" alt="Typing SVG" />

<br/><br/>

[![Backend](https://img.shields.io/badge/Backend-Express_5_%2B_TypeScript-000000?style=for-the-badge&logo=express&logoColor=white)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Cache/Queue](https://img.shields.io/badge/Cache_%2F_Queue-Redis_%2B_BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)](#)
[![Search](https://img.shields.io/badge/Search-Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)](#)
[![Containerized](https://img.shields.io/badge/Deploy-Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)

[![Multi-Tenant](https://img.shields.io/badge/Architecture-Multi--Tenant_SaaS-6366f1?style=flat-square)](#)
[![RBAC](https://img.shields.io/badge/Access_Control-RBAC_%2B_Scoped_Permissions-blueviolet?style=flat-square)](#)
[![Real-time](https://img.shields.io/badge/Real--time-Socket.IO-black?style=flat-square&logo=socketdotio&logoColor=white)](#)
[![Tests](https://img.shields.io/badge/Backend_Tests-103%2B_Passing-brightgreen?style=flat-square)](#)
[![E2E](https://img.shields.io/badge/E2E-Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)](#)

</div>

<br/>

## 📖 Table of Contents

<details open>
<summary>Click to expand</summary>

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🏢 Multi-Tenancy Model](#-multi-tenancy-model)
- [🔐 Roles &amp; Permissions](#-roles--permissions)
- [🔄 Approval Workflow Engine](#-approval-workflow-engine)
- [⚠️ Contract Risk Scoring](#️-contract-risk-scoring)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚡ Getting Started](#-getting-started)
- [🔐 Environment Configuration](#-environment-configuration)
- [🔌 API Reference](#-api-reference)
- [🧪 Testing](#-testing)
- [🛡️ Security &amp; Hardening](#️-security--hardening)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📬 Contact](#-contact)
- [📄 License](#-license)

</details>

---

## ✨ Overview

> **Enterprise CLM Platform** is a multi-tenant, role-aware **Contract Lifecycle Management** system: the kind of internal tool a legal, procurement, or finance department uses to draft, route for approval, e-sign, track, and monitor risk on every contract an organization holds — end to end, in TypeScript, on both the API and the UI.

Contracts move through a real **state-machine-driven approval workflow** (Legal → Finance → Executive, with escalation), get **OCR'd and full-text indexed** on upload, are routed to **DocuSign or Adobe Sign** for e-signature, and are continuously scored for **risk** (overdue obligations, approaching expiry, high contract value, vendor risk). Every tenant's data is isolated at the **database query level**, not just the UI — the architecture is built so a repository *can't* forget to scope by tenant.

<div align="center">

| 🎯 Goal | 💡 Approach |
|---|---|
| True multi-tenancy | `AsyncLocalStorage`-based tenant context + a Mongoose plugin that auto-scopes every query |
| Real approval logic | An explicit workflow state machine, not a status enum with ad-hoc `if` checks |
| Actionable risk data | A weighted, explainable risk-scoring function — not a black-box number |
| Provider-agnostic e-signatures | An `ISignatureProvider` interface with DocuSign and Adobe Sign implementations |
| Verified, not assumed | 103+ passing backend tests, a documented hardening pass, and real CVE fixes |

</div>

---

## 🚀 Features

<table>
<tr>
<td width="50%" valign="top">

### 📄 Contract Management
- 📝 Full contract lifecycle: draft → in review → active → expired/terminated
- 🧾 **Contract templates & reusable clauses** with versioning
- 🔄 **Version history & diffing** for every contract revision
- 🔍 **Elasticsearch-powered full-text search** across contract content
- 📎 Document upload with **OCR text extraction** (Tesseract.js, via a background queue)

</td>
<td width="50%" valign="top">

### 🔄 Approval &amp; Signature
- ✅ Configurable **multi-level approval workflow** (Legal / Finance / Executive) with escalation
- ✍️ **E-signature integration** — DocuSign or Adobe Sign, selected per environment
- 🔔 Webhook-verified signature status updates
- 📬 Automated **reminder notifications** for pending approvals & upcoming obligations

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🏢 Organization &amp; Access
- 🏬 **Business units & departments** as first-class org-structure entities
- 🧑‍🤝‍🧑 **Vendor management** with vendor risk ratings
- 🔑 **Role-based access control**: Admin, Legal Officer, Finance Officer, Executive, Department User, Vendor
- 🌐 **Multi-tenant SaaS** — every organization's data is fully isolated

</td>
<td width="50%" valign="top">

### 📊 Insight &amp; Oversight
- ⚠️ **Explainable risk scoring** per contract (overdue obligations, expiry proximity, contract value, vendor risk)
- 📈 **Live dashboard** with cached summary metrics (Recharts on the frontend)
- 🧾 **Immutable audit log** for every tenant, isolated per tenant
- 🔌 **Real-time updates** via Socket.IO (workflow actions, notifications) with a Redis adapter for horizontal scaling

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────┐        REST + WebSocket        ┌────────────────────────────┐
│   React 19 + TypeScript   │ ◄─────────────────────────────► │   Express 5 + TypeScript      │
│   (Vite, Redux Toolkit,    │    axios + React Query           │   (Modular: 17 domain modules) │
│    Socket.IO client)       │    ws → Socket.IO                │                                │
└─────────────────────────┘                                 └───────────┬────────────────────┘
                                                                          │
                    ┌─────────────────────────┬─────────────────────────┼───────────────────────┐
                    ▼                          ▼                          ▼                        ▼
          ┌──────────────────┐      ┌──────────────────┐     ┌──────────────────────┐  ┌──────────────────────┐
          │    MongoDB          │      │    Redis             │     │    Elasticsearch        │  │  BullMQ Workers          │
          │  (Mongoose, tenant-   │      │  (cache, sessions,   │     │  (full-text contract      │  │  (OCR, search indexing,  │
          │   scoped via plugin)  │      │   Socket.IO adapter, │     │   search index)            │  │   reminders, notifications)│
          └──────────────────┘      │   BullMQ backing)     │     └──────────────────────┘  └──────────────────────┘
                                     └──────────────────┘
                                                                          │
                                                              ┌───────────┴────────────┐
                                                              ▼                          ▼
                                                    ┌──────────────────┐     ┌──────────────────┐
                                                    │   DocuSign /        │     │   Cloudinary        │
                                                    │   Adobe Sign         │     │   (document storage) │
                                                    │   (e-signature)      │     └──────────────────┘
                                                    └──────────────────┘
```

Backend modules are organized **by domain**, not by technical layer — `contracts/`, `workflow/`, `signature/`, `obligations/`, `risk/`, `documents/`, `tenants/`, `users/`, `vendors/`, `notifications/`, `audit/`, `templates/`, `business-units/`, `departments/`, `dashboard/` — each with its own controller, service, repository, model, routes, and validation, sitting on shared `core/` infrastructure (tenancy, RBAC, events, queues, realtime, error handling).

---

## 🏢 Multi-Tenancy Model

Every tenant's data is isolated **at the query layer**, not opted into per-repository:

- **`tenant-context.ts`** uses Node's `AsyncLocalStorage` to hold the current request's tenant ID — safe under concurrency, so two requests for two different tenants running at the same instant never cross-contaminate context, even interleaved on the same event loop.
- **`tenant-scope.plugin.ts`** is a Mongoose schema plugin applied to every tenant-owned model (`Contract`, `Vendor`, `Department`, `BusinessUnit`, `Template`, `Clause`, `ApprovalWorkflow`, `Obligation`, and — deliberately — `AuditLog`, so one tenant's admin can never see another tenant's audit trail). It automatically:
  1. **Stamps** the tenant ID onto new documents at `pre('validate')` time — and throws loudly if no tenant context exists, rather than silently letting untenanted data through.
  2. **Injects** `{ tenant: currentTenantId }` into every `find`, `aggregate`, and `countDocuments` call — so a repository method that *forgets* to filter by tenant still can't leak another tenant's data.

`User` is deliberately **not** scoped by the plugin — login has to look a user up by email before any tenant context can exist, so there's nothing to scope by at that point in the request.

---

## 🔐 Roles &amp; Permissions

<div align="center">

| Role | Typical Capabilities |
|:--|:--|
| 👑 **Admin** | Full access — every permission in the system |
| ⚖️ **Legal Officer** | Create/edit contracts, approve at the Legal step, manage obligations & vendors, manage org structure, read audit logs |
| 💰 **Finance Officer** | Read contracts, approve at the Finance step, manage obligations, view dashboard |
| 🎯 **Executive** | Read all contracts across every business unit, final-step approval, read audit logs |
| 🧑‍💼 **Department User** | Create/edit their own contracts, manage obligations |
| 🤝 **Vendor** | Read-only access to their own related contracts |

</div>

Permissions are enforced centrally through `rbac.middleware.ts` against a declarative `ROLE_PERMISSIONS` map — routes declare *what* permission they need, not *which* role, so adding a new role never means touching route files.

---

## 🔄 Approval Workflow Engine

Contracts move through an explicit **state machine** (`workflow.state-machine.ts`), not a loosely-checked status field:

```
  Submitted → [Legal Review] → [Finance Review] → [Executive Review] → Approved
                    │                  │                    │
                    ▼                  ▼                    ▼
                Rejected           Rejected             Rejected
                    │                  │                    │
                    └────────── (optional escalation) ───────┘
```

- Each approval level is a discrete step with its own status, approver, timestamp, and comments.
- `assertCanAct()` guards every transition — you can't approve a step that's already actioned, or act on a workflow that isn't `IN_PROGRESS`.
- Escalation is a first-class state (`isEscalated`, `escalatedTo`) rather than a workaround.
- Every transition fires a domain event through the internal **event bus**, which real-time notifications and the dashboard cache-invalidation both subscribe to.

---

## ⚠️ Contract Risk Scoring

Risk isn't a black-box number — `risk-scoring.util.ts` computes a transparent, weighted score with a human-readable breakdown of *why*:

<div align="center">

| Risk Factor | Points |
|:--|:--|
| Overdue obligations | 15 pts each, capped at 45 |
| Past expiry, still open | 40 pts |
| Expires within 30 days | 25 pts |
| Expires within 90 days | 10 pts |
| High contract value (≥ $100,000) | 15 pts |
| Workflow SLA breached | 15 pts |
| High-risk vendor | 20 pts (Medium: 10, Low: 0) |

</div>

Scores map to **Low / Medium / High / Critical** bands, and every contributing factor is returned alongside the score — so a Legal Officer sees *why* a contract is flagged, not just a color.

---

## 🛠️ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,redux,vite,tailwind,nodejs,express,mongodb,redis,elasticsearch,docker,git,github" />

</div>

<div align="center">

**Backend**

| Category | Technology |
|:--|:--|
| Runtime &amp; Language | **Node.js** + **TypeScript**, **Express 5** |
| Database | **MongoDB** via **Mongoose 8** |
| Caching &amp; Queues | **Redis** (`ioredis`) + **BullMQ** (OCR, search indexing, reminders, notifications) |
| Search | **Elasticsearch** (full-text contract search) |
| Real-time | **Socket.IO** + `@socket.io/redis-adapter` for multi-instance scaling |
| Auth | **JWT** (access + refresh) + **bcryptjs** |
| Validation | **Zod** schemas on every mutating endpoint |
| E-Signature | **DocuSign** &amp; **Adobe Sign** — pluggable via an `ISignatureProvider` interface |
| OCR | **Tesseract.js** (background worker) |
| File Storage | **Cloudinary** |
| PDF Generation | **pdfkit** |
| Email | **Nodemailer** |
| Security | **Helmet**, **express-rate-limit**, custom request sanitization |
| Logging | **Winston** |
| Testing | **Jest** + **Supertest** (103+ passing tests) |

**Frontend**

| Category | Technology |
|:--|:--|
| UI Library | **React 19** + **TypeScript** |
| Build Tool | **Vite** |
| State | **Redux Toolkit** + **TanStack React Query** |
| Routing | **React Router 7** with `ProtectedRoute` / `RoleGuard` |
| Forms &amp; Validation | **React Hook Form** + **Zod** |
| Styling | **Tailwind CSS** |
| Charts | **Recharts** |
| Real-time | **socket.io-client** |
| Icons | **lucide-react** |
| Testing | **Vitest**, **Testing Library**, **Playwright** (E2E) |

**Infrastructure**

| Category | Technology |
|:--|:--|
| Containerization | **Docker Compose** — Redis, Elasticsearch, backend, frontend as isolated services |

</div>

---

## 📁 Project Structure

```
clm-platform-production/
│
├── backend/
│   ├── src/
│   │   ├── app.ts                     # Express app assembly & middleware pipeline
│   │   ├── server.ts                   # Entry point
│   │   ├── config/                     # env (Zod-validated), database, redis, socket
│   │   ├── core/
│   │   │   ├── tenancy/                # AsyncLocalStorage context + Mongoose tenant-scope plugin
│   │   │   ├── middleware/             # auth, rbac, permissions.config, rate-limit, sanitize, audit-log
│   │   │   ├── events/                 # internal event bus + event type registry
│   │   │   ├── queues/                 # BullMQ queue factory & names
│   │   │   ├── realtime/               # Socket.IO broadcast plugin & bus
│   │   │   ├── scheduler/              # reminder-scan job (BullMQ upsertJobScheduler)
│   │   │   ├── search/                 # Elasticsearch client
│   │   │   └── errors/                 # AppError, error codes, global error handler
│   │   ├── modules/                    # 17 domain modules (see below)
│   │   └── routes/index.ts             # Central route mounting
│   ├── scripts/                        # create-superadmin.ts, seed.ts
│   ├── tests/                          # unit + integration (Jest/Supertest)
│   ├── HARDENING.md                    # Security/performance/dependency review log
│   ├── TENANCY.md                      # Multi-tenancy design notes
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── app/                        # Store, providers, app shell
│       ├── features/                   # contracts, workflow, signature, obligations, org-structure...
│       ├── routes/                     # ProtectedRoute, RoleGuard, routes.config
│       ├── shared/                      # Shared UI, hooks, utilities
│       └── test/                        # Vitest setup
│
├── docker-compose.yml                  # Redis, Elasticsearch, backend, frontend
└── README.md                           # You are here 👋
```

**Backend domain modules:** `audit` · `auth` · `business-units` · `contract-versions` · `contracts` · `dashboard` · `departments` · `documents` · `notifications` · `obligations` · `risk` · `signature` · `templates` · `tenants` · `users` · `vendors` · `workflow`

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- **Docker &amp; Docker Compose** (recommended — spins up MongoDB, Redis, and Elasticsearch for you)
- A **Cloudinary** account (document storage)
- A **DocuSign** or **Adobe Sign** developer/sandbox account (for e-signature)

### Option 1 — Docker Compose (recommended)

```bash
git clone https://github.com/Muzammil-khan-uni/Enterprise-Contract-Lifecycle-Management-CLM-Platform.git
cd Enterprise-Contract-Lifecycle-Management-CLM-Platform

cp .env.example .env         # fill in Mongo/Redis/JWT/Cloudinary/signature-provider values
docker compose up --build
```

This brings up Redis, Elasticsearch, the backend API, and the frontend as networked services.

### Option 2 — Run services locally

```bash
# 1. Backend
cd backend
cp .env.example .env          # fill in required values (see below)
npm install
npm run dev                    # nodemon + ts-node, watches for changes

# 2. Seed demo data (optional)
npm run superadmin              # create the first admin user
npx ts-node scripts/seed.ts      # seed sample tenants/contracts

# 3. Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

Backend health check: `GET /api/v1/health` — reports MongoDB and Redis connectivity.

### Build for production

```bash
# backend
cd backend && npm run build && npm start

# frontend
cd frontend && npm run build && npm run preview
```

---

## 🔐 Environment Configuration

Configuration is validated at startup with **Zod** (`config/env.ts`) — the server refuses to boot with a clear error if anything required is missing, rather than failing confusingly later.

<div align="center">

| Variable | Purpose |
|:--|:--|
| `MONGO_URI` / `REDIS_URL` | Core datastore connections |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Min. 32-character signing secrets for access &amp; refresh tokens |
| `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` | Token lifetimes (default `15m` / `7d`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Document storage provider |
| `SIGNATURE_PROVIDER` | `docusign` or `adobesign` |
| `DOCUSIGN_*` | Integration key, user/account IDs, private key, OAuth &amp; API base URLs, webhook HMAC key |
| `ADOBESIGN_*` | Client ID/secret, refresh token, base URI, webhook client ID |
| `ELASTICSEARCH_URL` | Full-text contract search backend |
| `CORS_ORIGIN` | Allowed frontend origin |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Global rate-limiting tuning |
| `EMAIL_FROM` / `SMTP_*` | Nodemailer transport for notification emails |

</div>

> 🔒 Only one signature provider needs to be fully configured at a time — set `SIGNATURE_PROVIDER` to match whichever set of credentials you populate.

---

## 🔌 API Reference

All routes are mounted under `/api/v1`. Full request/response contracts live in each module's `.validation.ts` (Zod schemas) and `.types.ts` files.

<details>
<summary><b>🔑 Auth &amp; Users</b></summary><br>

| Base | Description |
|:--|:--|
| `/auth` | Register, login, refresh, logout |
| `/users` | User CRUD, role assignment |
| `/tenants` | Tenant provisioning (superadmin) |

</details>

<details>
<summary><b>📄 Contracts &amp; Content</b></summary><br>

| Base | Description |
|:--|:--|
| `/contracts` | Contract CRUD, search, filtering |
| `/contracts/:id/versions` (contract-versions module) | Version history &amp; diffing |
| `/templates` | Contract templates &amp; reusable clauses |
| `/documents` | Upload, OCR status, storage retrieval |

</details>

<details>
<summary><b>🔄 Workflow, Signature &amp; Obligations</b></summary><br>

| Base | Description |
|:--|:--|
| `/workflow` | Submit for approval, approval queue, approve/reject, escalate |
| `/signature` | Request signature, provider webhook, status polling |
| `/obligations` | Contract obligations &amp; reminders |

</details>

<details>
<summary><b>🏢 Organization</b></summary><br>

| Base | Description |
|:--|:--|
| `/business-units` | Business unit CRUD |
| `/departments` | Department CRUD |
| `/vendors` | Vendor management &amp; risk ratings |

</details>

<details>
<summary><b>📊 Insight &amp; System</b></summary><br>

| Base | Description |
|:--|:--|
| `/dashboard` | Cached summary metrics for the UI |
| `/audit-logs` | Tenant-scoped, immutable audit trail |
| `/notifications` | In-app &amp; email notification delivery |
| `/health` | Mongo/Redis dependency health check |

</details>

---

## 🧪 Testing

<div align="center">

| Layer | Tooling | Coverage |
|:--|:--|:--|
| Backend unit &amp; integration | **Jest** + **Supertest** | 103+ passing tests across 25 suites |
| Frontend unit | **Vitest** + **Testing Library** | Component &amp; hook coverage |
| End-to-end | **Playwright** | Critical user flows across the UI |

</div>

```bash
# Backend
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Frontend E2E
cd frontend && npm run test:e2e
```

---

## 🛡️ Security &amp; Hardening

This project includes a documented, evidence-based hardening pass (see [`backend/HARDENING.md`](./backend/HARDENING.md)) rather than an assumed-secure claim. Highlights:

- 🚨 Identified and patched a **real high-severity CVE** (`multer` DoS vulnerabilities CVE-2025-47935 / CVE-2025-47944), found by investigating a deprecation warning `npm audit` didn't flag — not by trusting a clean audit.
- 🔧 Fixed a **silently broken lint setup** on both frontend and backend (present since early development) as part of an ESLint 8→10 flat-config migration.
- ⏱️ Rewrote the reminder scheduler for **BullMQ v6's breaking changes** to repeatable jobs, verified against real compiled types and the full test suite.
- 🪖 **Helmet**, **rate limiting**, **request sanitization**, and RBAC enforcement are applied globally, not per-route as an afterthought.
- 🔏 Every module implementing external webhooks (signature providers) verifies payloads cryptographically before trusting them.

---

## 🗺️ Roadmap

- [ ] 📱 Native mobile companion app for approvals on the go
- [ ] 🌍 Multi-language contract templates
- [ ] 🧠 AI-assisted clause suggestion &amp; contract summarization
- [ ] 📊 Custom, tenant-configurable dashboard widgets
- [ ] 🔗 Native integrations with Salesforce / SAP for vendor sync

Have an idea? Open an [issue](../../issues) — contributions are welcome!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

```bash
1. Fork the project
2. Create your feature branch   → git checkout -b feature/amazing-feature
3. Commit your changes          → git commit -m "Add amazing feature"
4. Push to the branch           → git push origin feature/amazing-feature
5. Open a Pull Request 🎉
```

---

## 📬 Contact

<div align="center">

**M. Muzammil Khan**
Software Engineer · Full-Stack (MERN) · Flutter &amp; Android

[![Email](https://img.shields.io/badge/Email-muz56565%40gmail.com-6366f1?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muz56565@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammed-muzammil-khan-617155373/)
[![GitHub](https://img.shields.io/badge/GitHub-Muzammil--khan--uni-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Muzammil-khan-uni)

📍 Rawalpindi, Pakistan &nbsp;|&nbsp; 📞 +92 330 4580951

</div>

---

## 📄 License

This project is licensed under the **GNU General Public License v2.0**. See the [`LICENSE`](./LICENSE) file for full terms.

---

<div align="center">

### ⭐ If this project helped you, consider giving it a star!

<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=0:6366f1,100:1e1b4b&amp;height=120&amp;section=footer" width="100%"/>

</div>
