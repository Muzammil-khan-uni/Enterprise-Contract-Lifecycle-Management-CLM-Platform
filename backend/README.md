# CLM Platform — Backend (Phase 0 Scaffold)

Enterprise Contract Lifecycle Management Platform API.

## Status
Phase 0: project scaffolding only. No domain logic implemented yet —
see `/CLM_Platform_Architecture_and_Plan.md` in the project root for
the full architecture and phased plan.

## Setup
```bash
cp .env.example .env    # fill in Mongo/Redis/JWT/Cloudinary values
npm install
npm run dev              # starts with nodemon on PORT (default 5000)
```

## Verify
```bash
curl http://localhost:5000/api/v1/health
# { "success": true, "data": { "status": "ok" } }
```

## Structure
See `src/` — organized by domain module under `src/modules/*`, with
cross-cutting concerns in `src/core/*` and configuration in `src/config/*`.
Each module folder currently contains only a `.gitkeep` placeholder
noting which phase implements it.

## Scripts
- `npm run dev` — start in watch mode
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled build
- `npm test` — run Jest tests
- `npm run lint` — run ESLint
