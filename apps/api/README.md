# nourish-api — canonical food catalog API (slice S1)

Public **read-only** NestJS API serving the canonical Ethiopian FCT 2025 food
catalog. No auth, no user data, no mutation endpoints in S1. Nutrition values
are imported verbatim from the staged FCT extract/fixture — **never derived,
never invented** (ADR-0006). Portion gram weights are Nourish standard
measures (`portionSource: nourish-standard`) — not FCT data.

## Stack

NestJS 11 · TypeScript 5 · PostgreSQL 16 (Prisma 6) · helmet · @nestjs/throttler ·
Redis provisioned for S3 queue parity only (no queue code in S1, D2).

## API (v1, §blueprint §8)

| Route | Notes |
|---|---|
| `GET /v1/healthz` | db ping; rate-limit exempt |
| `GET /v1/foods?q=&category=&page=&limit=` | q ≤ 100 chars; category ∈ ethiopian,breakfast,lunch,dinner,snacks; page ≥ 1; limit 1..100 (default 20) |
| `GET /v1/foods/categories` | declared before `/v1/foods/:id` (route order) |
| `GET /v1/foods/:id` | stable id (seed slug or `fct-<code>`); 404 envelope |
| `GET /v1/catalog` | full snapshot; `If-None-Match: <version>` → 304 |

Errors: `{"error":{"code","message","requestId"}}` with codes
`FOOD_NOT_FOUND | VALIDATION_ERROR | RATE_LIMITED | INTERNAL`; 5xx messages are
sanitized. Rate limit 60/min/IP (configurable), healthz exempt.

## Run locally

```powershell
docker compose up -d          # postgres:16-alpine + redis:7-alpine (dev only)
Copy-Item .env.example .env   # adjust as needed
npm install
npx prisma migrate deploy     # or: npx prisma migrate dev
npm run import:fct:fixture    # idempotent import of the verified fixture subset
npm run start:dev
```

`GET http://localhost:3000/v1/healthz` → `{"status":"ok",...,"db":"up"}`.

## FCT import pipeline (CLI-only — never HTTP)

```powershell
npm run import:fct:acquire        # download the FCT 2025 PDF, print sha256
npm run extract:fct                # requires the PDF; regenerates the staged JSONL
npm run verify:extract             # double-entry verification vs FAO text layer
npm run import:fct:fixture         # import the committed fixture subset
npm run import:fct:file -- <file>  # import an arbitrary staged extract
npm run import:fct:status          # list recent ImportRuns
npm run db:seed                    # dev seed = fixture import (idempotent)
```

Data provenance, acquisition URLs, sha256, license, coverage statement, and the
S0→FCT mapping table: **`prisma/fixtures/README.md`** (read it). The source PDF
is never committed.

## Data coverage (state it everywhere — D5)

The committed staged extract covers **722 of 727** EFCT 2025 entries (the
published Condensed Food Composition Table; the remaining 5 live in the Excel
datasheet distribution, not this PDF). The importable fixture subset covers
**18 of the 20 S0 seed foods**; avocado and banana are excluded because the
condensed table prints their energy in kJ only (no kcal — kcal is never
derived). Full extraction/coverage details are in the fixtures README.

## Tests

```powershell
npm run lint                    # strict TS lint
npm run build                   # nest build (tsc, strict)
npx prisma validate             # schema check
npm test                        # unit: canonicalizer, validator, fixture parity
npm run test:e2e                # e2e: foods/catalog/imports/security (needs Docker Postgres)
```

e2e provisions a dedicated `nourish_test` database, applies
`prisma migrate deploy`, and truncates between suites (`test/setup.ts`).

## Environment

See `.env.example` (committed) — `.env` is gitignored. `SENTRY_DSN` optional;
Sentry is fully disabled when unset (D4).
