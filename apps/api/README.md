# nourish-api — catalog, analysis, accounts and sync

NestJS API for Nourish. The catalog lane is **read-only** and public; the
analysis lane is anonymous and stores no imagery; the account lane owns identity,
sessions and consent. Nutrition values are imported verbatim from the staged FCT
extract/fixture — **never derived, never invented** (ADR-0006). Portion gram
weights are Nourish standard measures (`portionSource: nourish-standard`) — not
FCT data.

## Stack

NestJS 11 · TypeScript 5 · PostgreSQL 16 (Prisma 6) · helmet · @nestjs/throttler ·
Redis 7 provisioned for queue parity (no queue code yet).

## API (v1)

| Route | Notes |
|---|---|
| `GET /v1/healthz` | db ping; rate-limit exempt |
| `GET /v1/foods?q=&category=&page=&limit=` | q ≤ 100 chars; category ∈ ethiopian,breakfast,lunch,dinner,snacks; page ≥ 1; limit 1..100 (default 20) |
| `GET /v1/foods/categories` | declared before `/v1/foods/:id` (route order) |
| `GET /v1/foods/:id` | stable id (seed slug or `fct-<code>`); 404 envelope |
| `GET /v1/catalog` | full snapshot; `If-None-Match: <version>` → 304 |
| `POST /v1/analyses` | S2: `{text}` or `{imageBase64}`; per-route rate limit + daily budget guard; imagery is never persisted |
| `GET /v1/analyses/:id` | S2: the stored analysis run |
| `POST /v1/analyses/:id/corrections` | S2: user corrections; best-effort (204) |
| `POST /v1/auth/otp` | S3 (AUTH-02): send a six-digit code; the code is never in the response. Tight per-route limit — each call costs an SMS |
| `POST /v1/auth/otp/verify` | S3 (AUTH-02): exchange the code for a session, creating the account if new |
| `POST /v1/auth/refresh` | S3 (AUTH-03): rotate the refresh credential; the old one stops working, and a replay revokes the family |
| `POST /v1/auth/logout` | S3 (AUTH-03): end this device's session; idempotent |
| `GET /v1/me` | S3: the signed-in user's own record (plan, consent, session count) |
| `POST /v1/sync` | S3 (OFF-02): apply the device's queued operations in order, idempotent by client id, device-clock last-write-wins, per-operation outcomes |
| `GET /v1/sync/changes?since=&limit=` | S3 (OFF-02): everything the device has not seen, tombstones included |

Errors: `{"error":{"code","message","requestId"}}`. Codes include
`FOOD_NOT_FOUND | VALIDATION_ERROR | RATE_LIMITED | INTERNAL`,
`AI_UNAVAILABLE | AI_INVALID_OUTPUT | AI_TIMEOUT | NO_FOOD_DETECTED | AI_BUDGET_EXHAUSTED`,
`PHONE_INVALID | OTP_INVALID | OTP_EXPIRED | OTP_TOO_MANY_ATTEMPTS |
OTP_RESEND_TOO_SOON | SMS_UNAVAILABLE | UNAUTHENTICATED | TOKEN_EXPIRED |
TOKEN_REUSED | ACCOUNT_DISABLED`. 5xx messages are sanitized.

Provider seams, both refused in production when unset: the AI provider
(`AI_PROVIDER=none | openai-compatible | fixture`, and `fixture` is refused when
`NODE_ENV=production`) and the SMS provider (`SMS_PROVIDER=none | console | http`,
with `console` refused in production). **No key and no gateway credential exist in
this environment**, so the real recognition path and real SMS delivery are
implemented but have never been exercised against a live provider.

## Run locally

```powershell
docker compose up -d          # postgres:16-alpine + redis:7-alpine (dev only)
Copy-Item .env.example .env   # then set JWT_SECRET; SMS_PROVIDER=console for dev
npm install
npx prisma migrate deploy     # or: npx prisma migrate dev
npm run import:fct:fixture    # idempotent import of the verified fixture subset
npm run start:dev
```

`GET http://localhost:3000/v1/healthz` → `{"status":"ok",...,"db":"up"}`.

Signing in locally: `POST /v1/auth/otp` with `SMS_PROVIDER=console` writes the
code to this process's log — read it there, then `POST /v1/auth/otp/verify`.
`apps/mobile/tool/auth_live_check.dart` automates exactly that round trip.

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
npm test                        # unit: canonicalizer, validator, fixture parity, phone, crypto, merge, CORS, pipeline, AI validator
npm run test:e2e                # e2e: foods/catalog/imports/security/analysis/auth/sync (needs Docker Postgres)
npm audit --audit-level=moderate
```

e2e provisions a dedicated `nourish_test` database, applies
`prisma migrate deploy`, and truncates between suites (`test/setup.ts`).

## Environment

See `.env.example` (committed) — `.env` is gitignored. Notable variables:
`JWT_SECRET` (required), `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`,
`OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`,
`OTP_REQUEST_RATE_LIMIT`, `SMS_PROVIDER`, `AI_PROVIDER`, and the CORS origin
list. `SENTRY_DSN` is optional; Sentry is fully disabled when unset (D4).
