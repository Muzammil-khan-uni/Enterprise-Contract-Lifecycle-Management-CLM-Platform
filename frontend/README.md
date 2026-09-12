# CLM Platform — Frontend (Phase 0 Scaffold)

React 19 + TypeScript client for the Enterprise CLM Platform.

## Status
Phase 0: project scaffolding only. No feature pages implemented yet —
see `/CLM_Platform_Architecture_and_Plan.md` in the project root for
the full architecture and phased plan.

## Setup
```bash
cp .env.example .env
npm install
npm run dev    # http://localhost:5173
```

## Structure
- `src/app` — store config, root App component
- `src/features/*` — one folder per domain (mirrors backend modules), each with its own `api/`, `components/`, `pages/`
- `src/shared` — reusable UI components, hooks, layouts, and lib clients (axios, React Query, sockets)
- `src/routes` — route table and auth/RBAC guards

## State management
- **Server state** → React Query (`@tanstack/react-query`)
- **Global client state** → Redux Toolkit (`src/app/store.ts`)
- **Forms** → React Hook Form
See architecture doc §7.2 for the rationale behind this split.
