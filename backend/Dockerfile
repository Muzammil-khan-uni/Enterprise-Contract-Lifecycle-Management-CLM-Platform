# Multi-stage build: the `deps`/`build` stages have devDependencies
# and TypeScript source; the final `runtime` stage ships only
# compiled JS plus production dependencies, kept small deliberately
# since this image runs at 25,000-concurrent-user scale where image
# pull time and memory footprint both matter across many replicas.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# poppler-utils provides `pdftoppm`, used to rasterize page 1 of an
# uploaded PDF before OCR (see modules/documents/pdf-rasterize.util.ts).
# Without this, PDF OCR silently no-ops (the util catches the missing
# binary and returns null — see its docstring) rather than the image
# build failing, but installing it here is what makes that feature
# actually work in a real deployment instead of only in dev, where a
# developer's own machine happened to have it. --no-install-recommends
# keeps this from pulling in poppler's much larger recommended-package
# set (fonts, etc.) that this feature doesn't need.
RUN apt-get update \
  && apt-get install -y --no-install-recommends poppler-utils \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Runs as a non-root user — a container escape shouldn't hand an
# attacker root inside the container on top of it.
RUN useradd --system --uid 1001 clm
USER clm

EXPOSE 5000

# REMEDIATION (production-readiness pass): no HEALTHCHECK previously
# existed, so Docker/an orchestrator had no way to detect a running-
# but-unable-to-serve-traffic container (e.g. its MongoDB/Redis
# connection dropped) short of actual request failures reaching real
# users. Pairs with the /health endpoint fix in routes/index.ts, which
# now reports 503 in exactly that situation instead of a blind 200 —
# this HEALTHCHECK is what actually acts on that signal. Uses Node's
# built-in fetch (no curl/wget in the slim base image, and installing
# one just for this isn't worth the extra image layer) and exits
# non-zero on any non-2xx status or network failure, which is what
# `docker inspect --format='{{.State.Health.Status}}'` and container
# orchestrators key off of to restart/stop-routing-to an unhealthy
# instance.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
