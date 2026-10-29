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
| `apps/mobile-rn` | **Active React Native MVP** (Expo 58, TypeScript, React Navigation). Rebuild of the approved mobile experience with offline-first persisted state. |
| `apps/mobile` | Verified Flutter implementation retained as a migration/reference client. |
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
cd apps/mobile-rn
npm ci
Copy-Item .env.example .env
npm start                       # Expo dev server / Android / iOS via Expo Go or a dev build
```

The React Native app reads `EXPO_PUBLIC_API_URL` for the catalog and analysis
lanes. With no API running it keeps the bundled seed catalog, supports offline
manual search/logging/history, and tells the user when provider-dependent lanes
cannot run.

### Accounts, Google, and scanning

The React Native app offers email/password registration, email login, Google
sign-in, and the existing phone OTP lane. Email and Google accounts are created
or linked by the API; Google ID tokens are verified server-side.

Configure all OAuth client IDs in `apps/mobile-rn/.env` and the accepted
audiences in `apps/api/.env`:

```powershell
# apps/mobile-rn/.env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...

# apps/api/.env
GOOGLE_CLIENT_IDS=web-client-id,ios-client-id,android-client-id
```

For photo or text recognition, deploy the API with
`AI_PROVIDER=openai-compatible`, `AI_BASE_URL`, and `AI_API_KEY`. Without this
configuration a scan fails honestly and offers **Find food manually**; it never
returns a canned recognition result. The release workflow reads
`NOURISH_API_URL` and the three Google client IDs from GitHub repository
variables.

The legacy Flutter app remains runnable:

```powershell
cd apps/mobile
flutter pub get
flutter run
```

The current React Native preview is
[`v1.3.3`](https://github.com/kylosonic/nourish/releases/tag/v1.3.3). It includes
first-run camera/photo/notification permission setup, the neo-brutalist interface
with an animated floating navigation pill,
email/Google/phone entry points, exact-gram food portions, scheduled hydration
notifications, shorter copy, and manual scanner recovery. The Android APK is
installable for testing; the iOS IPA is unsigned and requires Apple signing
before it can be installed.

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

# Active React Native MVP (apps/mobile-rn)
npm run lint
npm run typecheck
npm test                                 # deterministic domain suite
npx expo export --platform web

# Domain and design system (packages/*)
flutter test                             # 27 and 13 tests

# API (apps/api)
npm run lint
npm run build
npx prisma validate
npm test                                 # 93 unit tests
npm run test:e2e                         # 83 e2e tests (needs Docker Postgres)

# Repository tooling (root)
node --test "scripts/*.test.mjs"                       # 9 tests
node --test "apps/website/test/*.test.mjs"             # 12 tests
node scripts/generate-latest-json.mjs --check
```
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
| S3 — accounts and sessions (device) | Built: phone OTP, email/password, and Google identity flows with secure token storage, session restore, sign-out, and account linking; live Google credentials are not present |
| S3 — **offline queue + backup push** | Built and verified live: every local change (meal, meal delete, water, weight) is queued in the same transaction, pushed on request with per-operation outcomes, and refused changes stay queued with the server's reason. **Restore is NOT BUILT**: the app can already *read* the account's rows (GET /v1/sync/changes, live-verified) but does not write them back into the local database yet, so this is a backup rather than a sync, and the account screen says so |
| S4 — weekly insights, weight logging, adjustable water goal, "what can I eat" | Built, verified |
| S4 — hydration reminders (WW-02), entitlements/paywall (SUB-01) | Hydration reminders are implemented as native local notifications at 10:00, 14:00, and 18:00. The paywall remains **NOT BUILT**: it has no design (P-SUB-1) or payment provider (P-PROV-1) |
| S5 — website, release metadata, in-app update check | Built, verified. The release pipeline itself has never run: it needs a remote and the secrets in `docs/release-process.md` |

Honest limits, stated everywhere they matter: no deployed API URL, Google OAuth
client IDs, or AI provider key is configured in this repository; no production
SMS gateway credential is present; and no store release is signed. The current
unsigned CI release produces an installable Android APK and a non-installable
unsigned iOS IPA.

## For contributors

Read `AGENTS.md`, then `docs/swarm/STATE.md` (what is true right now),
`docs/behaviors/` (what the product must do — the source of truth for behaviour),
and `docs/adr/` (decisions that are not to be re-litigated). Undesigned screens
are built provisionally and recorded as `PPA-n` in
`docs/plans/provisional-product-assumptions.md` — that file is the list of
everything awaiting product sign-off.
