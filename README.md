# Nourish

An offline-first Ethiopian nutrition tracker: log a meal, see what it actually
contains, and get targets and insight from the Ethiopian Food Composition Table
2025 rather than from a model.

**The one rule everything else follows:** nutrition numbers are data, not
generated text. Every value the app shows comes from the Ethiopian FCT 2025
(EPHI & FAO) via a deterministic `per100g × grams / 100`, rounded half away from
zero. No AI provider is ever asked to compute or choose nutrition, and when a
provider is missing the app says so instead of substituting a plausible answer.

## Repository layout

| Path | What it is |
| --- | --- |
| `apps/mobile` | Flutter app (Riverpod, GoRouter, Drift/SQLite). Offline-first: it works with no account and no network. |
| `apps/api` | NestJS 11 + Prisma 6 + PostgreSQL 16 API: FCT catalog, meal analysis pipeline, accounts and sync endpoints. |
| `apps/website` | Static marketing site (no cookies, no analytics, bundled fonts). |
| `packages/domain` | Pure Dart nutrition engine: targets, portions, snapshots. No Flutter, no I/O. |
| `packages/design-system` | Tokens, theme and widget primitives (Inter + Noto Sans Ethiopic bundled). |
| `scripts` | Release tooling: `releases/latest.json` generator and its contract tests. |
| `docs` | Behaviour contracts, ADRs, slice blueprints, release process, and `docs/swarm/STATE.md` — the authoritative ledger of what is built, verified and still open. |

## Run it

Prerequisites: Flutter 3.44.x, Node 24, Docker Desktop.

**API**

```powershell
cd apps/api
docker compose up -d            # postgres:16-alpine + redis:7-alpine, loopback-only
Copy-Item .env.example .env     # then set JWT_SECRET; SMS_PROVIDER=console for local dev
npm install
npx prisma migrate deploy
npm run import:fct:fixture      # idempotent import of the verified FCT fixture subset
npm run start:dev               # http://127.0.0.1:3000/v1/healthz
```

**Mobile**

```powershell
cd apps/mobile
flutter pub get
flutter run                     # Windows/Android; the app needs no API to be usable
```

The app reads `apiBaseUrl` for the catalog and analysis lanes; with no API
running it falls back to the bundled seed catalog and text logging still works
offline (AI recognises nothing, and it says so).

**Website**

```powershell
cd apps/website
python -m http.server 8080      # any static server; there is no build step
```

## Verify

Every command below is the exact one used for the recorded evidence in
`docs/swarm/STATE.md`.

```powershell
# Mobile (apps/mobile)
flutter analyze
flutter test                             # 246 tests

# Domain and design system (packages/*)
flutter test                             # 27 and 13 tests

# API (apps/api)
npm run lint
npm run build
npx prisma validate
npm test                                 # 91 unit tests
npm run test:e2e                         # 83 e2e tests (needs Docker Postgres)

# Repository tooling (root)
node --test "scripts/*.test.mjs"                       # 9 tests
node --test "apps/website/test/*.test.mjs"             # 12 tests
node scripts/generate-latest-json.mjs --check
```n
Two live checks need the API running (they are manual on purpose: the test suite must stay offline). They are what caught the wire mismatches the fakes had hidden:

```powershell
dart run tool/auth_live_check.dart request +251911000123   # then read the code from the API log
dart run tool/auth_live_check.dart session +251911000123 123456
dart run tool/sync_live_check.dart  +251911000123 123456   # push, then read the rows back
```

Note: `node --test <directory>` fails with `MODULE_NOT_FOUND` on this Node/Windows
build — always pass an explicit glob, as above.

## What is built, and what is not

| Slice | State |
| --- | --- |
| S0 — foundation, onboarding, home, manual logging | Built, verified, released as `v0.1.0-s0` |
| S1 — FCT 2025 import + catalog API | Built, verified (27 571 extracted values double-entry checked against the published table) |
| S2 — meal analysis (text + photo) and edit-before-save | Built, verified. The real recognition path is implemented and unit-tested against a fake provider; **no AI provider key exists in this environment**, so it has never been exercised against a real model |
| S3 — accounts, sessions, sync endpoints (server) | Built, verified over HTTP |
| S3 — accounts and sessions (device) | Built and verified live against the local API: sign-in, secure token storage, session restore, sign-out, account screen |
| S3 — **offline queue + backup push** | Built and verified live: every local change (meal, meal delete, water, weight) is queued in the same transaction, pushed on request with per-operation outcomes, and refused changes stay queued with the server's reason. **Restore is NOT BUILT**: the app can already *read* the account's rows (GET /v1/sync/changes, live-verified) but does not write them back into the local database yet, so this is a backup rather than a sync, and the account screen says so |
| S4 — weekly insights, weight logging, adjustable water goal, "what can I eat" | Built, verified |
| S4 — water reminders (WW-02), entitlements/paywall (SUB-01) | **NOT BUILT.** Reminders need platform notification support that cannot be verified here; the paywall has no design (P-SUB-1) and no payment provider (P-PROV-1) |
| S5 — website, release metadata, in-app update check | Built, verified. The release pipeline itself has never run: it needs a remote and the secrets in `docs/release-process.md` |

Honest limits, stated everywhere they matter: no AI provider key, no SMS
gateway credential (SMS is exercised through the console gateway only), no store
release, and **nothing is merged to `master`** — it still points at the S0
release commit. Work happens on `feat/nourish-mvp`.

## For contributors

Read `AGENTS.md`, then `docs/swarm/STATE.md` (what is true right now),
`docs/behaviors/` (what the product must do — the source of truth for behaviour),
and `docs/adr/` (decisions that are not to be re-litigated). Undesigned screens
are built provisionally and recorded as `PPA-n` in
`docs/plans/provisional-product-assumptions.md` — that file is the list of
everything awaiting product sign-off.
