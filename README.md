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
| `apps/api` | NestJS 11 + Prisma 6 + PostgreSQL 16 API: FCT catalog, meal analysis pipeline, accounts and sync endpoints. |
| `apps/website` | Static marketing site (no cookies, no analytics, bundled fonts). |
| `scripts` | Release tooling: `releases/latest.json` generator and its contract tests. |
| `docs` | Behaviour contracts, ADRs, slice blueprints, release process, and `docs/swarm/STATE.md` — the authoritative ledger of what is built, verified and still open. |

## Run it

Prerequisites: Node 24, npm 11, Docker Desktop.

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

The latest published preview is `v1.3.5`. The current source is `1.4.0` and is
the store-launch build candidate: it adds full restore/automatic sync, account
deletion, consent sync, Gemini, passwordless email, barcode/label capture,
saved-meal editing, correction capture, state-aware reminders, and RevenueCat
entitlements. The `1.4.0` native binary has not yet been built or publicly
released.

**Website**

```powershell
cd apps/website
python -m http.server 8080      # any static server; there is no build step
```

## Verify

Every command below checks the active React Native app or API.

```powershell
cd apps/mobile-rn
npm ci
npm run lint
npm run typecheck
npm test                                 # deterministic domain suite
npx expo export --platform web

# API (apps/api)
cd ../api
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

Note: `node --test <directory>` fails with `MODULE_NOT_FOUND` on this Node/Windows
build — always pass an explicit glob, as above.

## What is built, and what is not

| Slice | State |
| --- | --- |
| S0 — foundation, onboarding, home, manual logging | Built, verified, released as `v0.1.0-s0` |
| S1 — FCT 2025 import + catalog API | Built, verified (27 571 extracted values double-entry checked against the published table) |
| S2 — meal analysis (text + photo) and edit-before-save | Built, verified. The real recognition path is implemented and unit-tested against a fake provider; **no AI provider key exists in this environment**, so it has never been exercised against a real model |
| S3 — accounts, sessions, sync endpoints (server) | Built, verified over HTTP |
| S3 — accounts and sessions (device) | Built: phone OTP, Firebase phone-token exchange, email/password, passwordless email OTP, and Google identity flows with secure token storage |
| S3 — **sync, restore and account lifecycle** | Built: push, pull/restore, cursor persistence, last-write-wins conflict handling, tombstones, foreground/reconnect/background sync, server-synced consent, and permanent in-app account deletion |
| S4 — weekly insights, weight logging, adjustable water goal, "what can I eat" | Built, verified |
| S4 — hydration reminders, entitlements/paywall | Configurable state-aware reminders pause once the daily water goal is met. RevenueCat monthly/annual billing is abstracted behind an entitlement service with restore and a clearly labelled UAT mock mode. Store products and keys remain external |
| Missing product features | Open Food Facts barcode lookup, cached backend products, Gemini label OCR fallback, saved-meal editing, correction capture, and the Plus paywall are implemented. Unreadable or incomplete packaged-food data is never estimated |
| S5 — website, release metadata, in-app update check | Built and verified. React Native preview builds are published through the React Native artifacts workflow. |

Honest limits: deployment manifests and environment seams are present, but live
Render, Google OAuth, Gemini, Resend/SMTP, Firebase, and RevenueCat credentials
must be supplied. No store release is signed. Human physical-device UAT remains
required; see [`BUILD_AND_UAT_CHECKLIST.md`](BUILD_AND_UAT_CHECKLIST.md).

## For contributors

Read `AGENTS.md`, then `docs/swarm/STATE.md` (what is true right now),
`docs/behaviors/` (what the product must do — the source of truth for behaviour),
and `docs/adr/` (decisions that are not to be re-litigated). Undesigned screens
are built provisionally and recorded as `PPA-n` in
`docs/plans/provisional-product-assumptions.md` — that file is the list of
everything awaiting product sign-off.
