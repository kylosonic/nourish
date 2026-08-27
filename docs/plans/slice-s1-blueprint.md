# Slice S1 Blueprint — Backend + Canonical Food API (Ethiopian FCT 2025)

- **Status:** PLANNED (approved by @architect 2026-08-26)
- **Branch:** `feat/nourish-mvp`
- **Slice:** S1 per ADR-0002
- **Architect decisions:** D1–D5 resolved — see §Decisions requested / ADR-0006.
- **Predecessor:** S0 released `v0.1.0-s0` (commit `80800d4`; 127 tests green: 87 mobile + 13 design-system + 27 domain)
- **Environment:** Flutter 3.44.8 / Dart 3.12.2 / Node v24.16.0 / npm 11.13.0 / Docker CLI 29.3.1 (daemon check at T0) / git 2.55.0
- **Graphify note:** not installed — limitation recorded (AGENTS.md §9). `graphify update .` at Gate E if available.
- **Absent inputs recorded:** `docs/adr/tech-backlog.md` does not exist; no Graphify wiki/report exists.

## 0. Research findings (pre-plan evidence)

- **FCT 2025 acquisition:** the Ethiopian Food Composition Table 2025 (EPHI & FAO) is
  publicly downloadable as a PDF (EPHI website; FAO openknowledge record
  `20.500.14283/cd9308en`; citation: "Ethiopian Public Health Institute (EPHI) and Food and
  Agriculture Organization of the United Nations (FAO) 2025. The Ethiopian Food Composition
  Table 2025. Addis Ababa, Ethiopia."). Verified via web search 2026-08-26 (URLs recorded in §10).
  The dataset is PDF-shaped, not CSV-shaped → the import pipeline targets a **committed staged
  JSONL extract** produced by a committed extraction script, with the source PDF's sha256 + URL
  recorded in provenance. The PDF itself is NOT committed (size + redistribution question —
  see D1, resolved).
- **S0 integration surface:** `lib/data/**` + `lib/providers.dart` are the exact files S1 evolves.
  `FoodRepository` composes Drift rows into domain `Food`s; `Foods` table already carries
  `sourceName/sourceVersion/isSeed`; domain `FoodSource` already models
  `name/version/foodCode/reference/importDate` (unpersisted today). S0 blueprint §18 risk 1
  is honored: **only data-source internals change; features/screens are untouched** except the
  listed maintenance items.
- **QA MINORs 1–7** are on file in STATE.md (folded in per §12; #4 stays @vision-owned, not S1).

## 1. Goal

Stand up `apps/api` (NestJS + TypeScript + PostgreSQL + Prisma + Redis-provisioned) with the
canonical food layer per ADR-0004/TGT-05: an idempotent, version-gated, fully-provenanced
Ethiopian FCT 2025 import pipeline, and a public read-only food search + catalog API that
serves both the S1 mobile offline-cache sync and the S2 AI retrieval stage. The mobile catalog
migrates from the S0 provisional seed to **API-with-offline-cache** (OFF-01), with the seed
relabeled as first-cache bootstrap data replaced by the FCT catalog on first successful sync.
No auth, no user data on the backend in S1. Honesty rule: nutrition values come only from the
verified FCT extract/fixture — never invented; portion gram weights are Nourish-defined
standard measures with their own provenance label.

## 2. Scope and non-scope

**In scope:** `apps/api` scaffold; Prisma food-layer schema + migrations; FCT 2025 acquisition
task; extract→validate→canonicalize→import→verify pipeline (CLI, not HTTP); food search API
(GET /v1/foods, /v1/foods/:id, /v1/foods/categories, /v1/catalog, /v1/healthz); error envelope;
rate limiting; CORS; helmet; env via `.env` (gitignored) + `.env.example`; containerized dev
(Postgres + Redis) with recorded fallback; mobile data-source swap (Drift v2 migration,
CatalogDataSource seam, sync service, seed relabel); S0 maintenance tasks (QA MINORs 1, 2, 3, 5,
6, 7); tests; security Gate D (re-opened); minimal API CI workflow.

**Out of scope (S2+):** auth/OTP, user/profile/meal tables server-side, OFF-02 queued user-data
sync, AI lanes, corrections capture (SAFE-07; schema must not block it — stable food ids
preserve the reference), admin tooling, pg_trgm/Typesense search upgrade, custom foods (P-LOG-4),
BullMQ queue *code* (Redis is provisioned only — D2), Sentry on mobile, new mobile screens/UI
beyond maintenance items. P-HOME-1/2/3, P-SCAN-*, P-AUTH-1 remain untouched/unblocked.

## 3. Tickets

Behavior IDs touched: **TGT-05** (food layer normalization + provenance), **TGT-02** (portion
tables per food in DB), **LOG-05** (search over canonical catalog, offline lane), **OFF-01**
(cached-catalog snapshot semantics), **SAFE-02** (system rules on the API side). Master prompt
sections relied on: §5 (stack), §9 (database, food-layer subset only), §10 (FCT authority +
provenance), §11 (food entity), §12 (portion engine in DB), §13 (nutrition engine per-100g),
§16 (validated JSON shape — S2 consumer), §54 (observability), §56 (testing), §59 (secrets),
§60 (env config), §61 (code quality), §63 (offline mode).

Maintenance items (STATE.md QA MINORs): **M1** providers.dart↔onboarding_controller.dart
circular import; **M2** HOME-03 widget test (multi-items-per-slot totals); **M3** injectable
clock provider; **M5** remove dead `honestVoidFeatures`; **M6** notifications void copy;
**M7** welcome scroll wrap. (**M4** PPA-7 slot-row = product question, owned by @vision —
tracking only; no engineering work.)

Placeholder ticket IDs per execution contract: `TECH-S1-*` (no tracker wired).

## 4. Acceptance criteria (each with verification method)

| # | Criterion | Verification |
|---|---|---|
| A1 | API boots against Postgres; `/v1/healthz` 200 with db status | `npm run test:e2e` health spec; manual `curl` in T5 |
| A2 | Fixture FCT import commits N foods; every food has non-null `source_name, source_version, source_food_code, source_reference, import_date` | integration test asserting non-null on all rows (imports.e2e) |
| A3 | Nutrition values are byte-equal to the staged extract rows (never invented) | fixtures parity spec: DB row ↔ fixture row equality |
| A4 | Re-running the import with same (source, version, sha256) is a no-op | idempotency spec (row counts + single ImportRun) |
| A5 | New extract sha256 (same version) supersedes in place; stale codes → Deprecated, never hard-deleted | re-import spec |
| A6 | `GET /v1/foods?q=doro+wet` and `q=ዶሮ ወጥ` return the same canonical food | e2e alias-resolution spec (EN + AM) |
| A7 | Category filter, pagination (meta.total/hasNextPage), bounds enforcement (limit ≤ 100, q ≤ 100 chars) | e2e pagination + validation specs |
| A8 | Unknown id → 404 with error envelope; bad query → 400 with field errors; burst → 429 | e2e error-envelope spec |
| A9 | `GET /v1/catalog` returns full snapshot with version + sha256; `If-None-Match` → 304 | e2e catalog spec |
| A10 | CORS: allowed origins only; helmet headers present; OPTIONS preflight works | e2e security spec |
| A11 | No user/profile tables exist in the S1 schema; only food-layer + imports models | `npx prisma validate` + schema grep in Gate D |
| A12 | Mobile: bootstrap-seed search works with zero network (OFF-01); after a fake sync the FCT snapshot is searchable offline; failed sync keeps the seed | mobile `offline_search_fallback_test.dart`, `catalog_sync_test.dart` |
| A13 | Mobile: sync is version-gated (same `catalog_version` → no-op) | `catalog_sync_test.dart` (fake datasource) |
| A14 | Zero-egress confinement: `http`/`dart:io`/`HttpClient` imports exist only under `lib/data/sources/` and `lib/data/sync/` (plus bootstrap wiring) | grep gate script (recorded in Gate B evidence) |
| A15 | Existing 127 S0 tests stay green; `flutter analyze` clean | `flutter test` (127+) + `flutter analyze` |
| A16 | M1 circular import gone | `dart analyze` (file-level cycle flag) + grep `import .*providers.dart` in controller |
| A17 | M2 HOME-03 multi-items-per-slot totals widget test exists and passes | `home_meals_totals_test.dart` |
| A18 | M3 clock injectable; midnight crossing recomputes day key | `clock_provider_test.dart` |
| A19 | M5 `honestVoidFeatures` removed (or wired); no unused-declaration warnings | `flutter analyze` |
| A20 | M6 notifications void renders dedicated copy | void-screen widget test |
| A21 | M7 welcome content scrolls on short viewports (320×480 renders both buttons reachable) | welcome widget test (small surface) |
| A22 | Import failure is atomic: invalid extract row → ImportRun `Failed`, zero food changes | failure-atomicity spec |

## 5. Dependency graph

```
apps/api (NestJS 11, Prisma, pg; NO dependency on mobile or Dart packages)
packages/domain        (unchanged, pure Dart)
packages/design-system (unchanged)
apps/mobile            → packages/domain, packages/design-system
                       → NEW lib/data/sources/ (http pkg — single egress seam)
```
**packages/shared + packages/api-client: NOT scaffolded in S1 (justified).** ADR-0001 says
packages appear lazily per slice. The only Dart consumer of the API in S1 is the mobile app
itself, whose DTO mapping is ~1 small file; the S2 AI retrieval consumer is server-side Node.
The API contract is versioned by e2e tests + this blueprint's §8, not by a shared package.
`packages/api-client` gets scaffolded in S3 (sync client, first second consumer) or when the
admin app arrives. No cycles possible: api ↔ mobile have a network contract only, no code edge.

## 6. Exact file tree

### `apps/api/` (NEW — ~48 files)
```
package.json                     — nestjs scaffold; scripts: start:dev, build, lint, test, test:e2e, import:fct*
package-lock.json                — COMMITTED (Windows/CI parity, like pubspec.lock)
tsconfig.json / tsconfig.build.json
nest-cli.json
eslint.config.mjs                — @nestjs/eslint-config + strict TS (master §61)
.env.example                     — DATABASE_URL, REDIS_URL, PORT, SENTRY_DSN (optional), CORS_ORIGINS, RATE_LIMIT_*
.env                             — gitignored (root .gitignore already covers .env/.env.*)
README.md                        — run instructions incl. docker compose + import commands
docker-compose.yml               — postgres:16-alpine (volume, port 5432), redis:7-alpine (port 6379); no host secrets
Dockerfile                       — API image (for CI/testcontainers path; dev is bare-node)
jest.config.js / test/jest-e2e.json
prisma/schema.prisma             — §9 models
prisma/migrations/               — generated (init_food_layer)
prisma/seed.ts                   — dev convenience: runs fixture import
prisma/fixtures/fct-2025-extract.jsonl   — COMMITTED staged extract (verification + provenance header)
prisma/fixtures/fct-2025-fixture-subset.jsonl — COMMITTED verified fixture subset (fallback + tests)
prisma/fixtures/README.md        — acquisition URLs, sha256, extraction + verification procedure
scripts/extract-fct.mjs          — PDF → JSONL extractor (pdfjs-dist); deterministic; logs row count
scripts/verify-extract.mjs       — row-count + spot-check verification vs published table
src/main.ts                      — helmet, CORS allowlist, global ValidationPipe, throttler, JSON body limit, /v1 prefix
src/app.module.ts
src/config/env.ts                — env schema (class-validator), throws on missing required vars
src/config/config.module.ts      — global ConfigModule
src/common/error/error-codes.ts  — FOOD_NOT_FOUND | VALIDATION_ERROR | RATE_LIMITED | INTERNAL
src/common/error/error-envelope.ts  — { error: { code, message, requestId } }
src/common/filters/http-exception.filter.ts — maps Nest exceptions → envelope; sanitizes 5xx
src/common/interceptors/request-id.interceptor.ts — per-request id (header X-Request-Id echo)
src/common/dto/pagination.dto.ts — page ≥ 1 (default 1), limit 1..100 (default 20)
src/common/logger/nourish-logger.ts — structured category logs (import, foods.search, catalog)
src/health/health.module.ts / health.controller.ts — GET /v1/healthz (db ping; no redis dependency)
src/foods/foods.module.ts
src/foods/foods.controller.ts    — GET /v1/foods, /v1/foods/categories (declared BEFORE :id), /v1/foods/:id, /v1/catalog
src/foods/foods.service.ts       — search (ILIKE canonical+normalized aliases, category, pagination), byId, catalog assembly
src/foods/foods.prisma-repository.ts — parameterized Prisma queries only (no raw SQL interpolation)
src/foods/dto/food-query.dto.ts  — q (≤100), category (whitelist enum), page, limit
src/foods/dto/food-summary.dto.ts / food.dto.ts / catalog.dto.ts / categories.dto.ts
src/imports/imports.module.ts
src/imports/imports.service.ts   — stage orchestration (validate → canonicalize → transaction → verify)
src/imports/imports.repository.ts — ImportRun CRUD + upsert-by-sourceFoodCode + deprecate-stale
src/imports/fct-row-validator.ts — numeric ranges (kcal 0..900/100g etc.), required fields, code uniqueness
src/imports/fct-parser.ts        — JSONL → FctRow[]
src/imports/canonicalizer.ts     — canonical-name normalization + alias generation (EN variants, curated Amharic, app transliterations, kind-tagged)
src/imports/transliterator.ts    — Geez↔Latin rule map (kind: appTransliteration; documented coverage)
src/imports/category-mapper.ts   — committed dish→chip mapping rules
src/imports/portion-standards.ts — Nourish standard measures per food family (portion_source: nourish-standard)
src/cli/import-fct.ts            — tsx CLI: acquire|import --fixture|--file (uses Nest context)
test/foods.e2e-spec.ts / catalog.e2e-spec.ts / imports.e2e-spec.ts / security.e2e-spec.ts
test/canonicalizer.spec.ts / fct-row-validator.spec.ts / fixture-parity.spec.ts
test/setup.ts                    — test DB strategy (see §15)
```

### `apps/mobile/` deltas (~10 modified + 5 new)
```
lib/core/clock.dart                          (NEW) — injectable Clock typedef/provider (M3)
lib/data/sources/catalog_data_source.dart    (NEW) — interface: searchLocal, fetchSnapshot(etag), replaceAll(version)
lib/data/sources/local_catalog_data_source.dart (NEW) — wraps FoodDao (logic moved from FoodRepository)
lib/data/sources/api_catalog_data_source.dart   (NEW) — http pkg; GET /v1/catalog + If-None-Match; 10s timeout;
                                              base URL: String.fromEnvironment('API_BASE_URL', default 'http://localhost:3000')
lib/data/sync/catalog_sync_service.dart      (NEW) — version-gated sync; transactional replace; failure ⇒ keep seed (OFF-01)
lib/data/sync/catalog_sync_state.dart        (NEW) — idle|syncing|synced(version)|failed
lib/data/database.dart                       (MOD) — schemaVersion 2; MigrationStrategy v1→v2 addColumns
lib/data/tables/tables.dart                  (MOD) — Foods += sourceFoodCode?, sourceReference?, importDate? (nullable; seed rows null)
lib/data/repositories/food_repository.dart   (MOD) — delegates to CatalogDataSource; public API + behavior unchanged
lib/data/seed/seed_catalog.dart              (MOD) — sourceName → 'provisional-seed-bootstrap' (relabel, PPA-8)
lib/data/seed/seed_importer.dart             (MOD) — unchanged logic; docstring: first-cache bootstrap replaced by FCT on sync
lib/providers.dart                           (MOD) — + catalogSyncServiceProvider, catalogSyncStateProvider, clockProvider;
                                              todayMeals/todayWater use clockProvider (M3)
lib/features/onboarding/onboarding_controller.dart (MOD) — M1: constructor-injected repositories; no providers.dart import
lib/bootstrap/bootstrap.dart                 (MOD) — fire-and-forget sync after seed import (non-blocking, master §62)
lib/l10n/strings.dart                        (MOD) — M5 remove honestVoidFeatures; M6 notifications void copy;
                                              search footer: bootstrap disclaimer pre-sync / FCT citation post-sync
lib/features/welcome/welcome_screen.dart     (MOD) — M7 scrollable content (SingleChildScrollView + safe minimum)
test/home_meals_totals_test.dart             (NEW) — M2
test/clock_provider_test.dart                (NEW) — M3
test/catalog_sync_test.dart                  (NEW) — version gate, replace, failure-keeps-seed (fake datasource)
test/offline_search_fallback_test.dart       (NEW) — seed-only search; post-sync FCT search; OFF-01 lane
test/welcome_scroll_test.dart                (NEW) — M7 small-surface
```

### Docs (~3)
```
docs/plans/slice-s1-blueprint.md   — this file
docs/adr/0006-fct-import-and-catalog-authority.md — (NEW, required) records D1/D3/D5 data-authority + import-pipeline decisions
docs/swarm/STATE.md                — @scribe update at gates
```
**~65 files total.** Largest file target < ~350 lines (S0 rule); import service decomposed into
stage modules. No monolithic god-file.

## 7. Dependency versions (guidance; resolve at scaffold time)

| Package | Line | Notes |
|---|---|---|
| @nestjs/* (core, common, platform-express) | ^11 | current major; pin exact at scaffold |
| @nestjs/config, @nestjs/throttler | ^4 / latest | resolve at install |
| helmet | ^8 | default headers |
| class-validator / class-transformer | ^0.14 | DTO + env validation (single validation stack) |
| prisma / @prisma/client | ^6 (or ^7 if GA) | pin at scaffold; commit `prisma/seed.ts` output is deterministic |
| pg | latest 8.x | driver |
| pdfjs-dist | ^5 | extraction script only (dev dependency) |
| tsx | ^4 | CLI runner |
| jest, supertest, ts-jest | ^30 / ^7 | e2e + unit |
| eslint @nestjs/eslint-config | current | strict TS per master §61 |
| **redis client** | **none in S1** | Redis provisioned in compose for parity only (D2) — no queue code |
| flutter: `http` | ^1.x | pure-Dart package (NOT a native plugin — justified: only stdlib-level dependency, offline-safe when unused); flutter_riverpod stays 2.6.1 (S0 solver constraint) |

`package-lock.json` COMMITTED (reproducible builds, like `pubspec.lock`).

## 8. API contract (v1, read-only, no auth)

Base path `/v1`. JSON, camelCase. Rate limit (throttler): 60 req/min/IP default, healthz exempt.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/v1/healthz` | — | `{status:"ok", service:"nourish-api", version, db:"up"}` |
| GET | `/v1/foods` | `q?` (≤100 chars), `category?` ∈ {ethiopian,breakfast,lunch,dinner,snacks}, `page?` ≥1, `limit?` 1..100 | `{data:[FoodSummary], meta:{page,limit,total,hasNextPage}}` |
| GET | `/v1/foods/categories` | — | `{data:["Ethiopian","Breakfast","Lunch","Dinner","Snacks"]}` |
| GET | `/v1/foods/:id` | path id (stable slug or `fct-<code>`) | `Food` (full: portions[], aliases[], source block) — 404 envelope if missing |
| GET | `/v1/catalog` | `If-None-Match: <version>` | 304 if unchanged; else `{version, generatedAt, sha256, foods:[Food]}` |

`FoodSummary`: `{id, canonicalName, category, defaultPortion:{unit,quantity,grams}, per100g:{kcal,proteinG,carbsG,fatG,fiberG?,sodiumMg?}, source:{name,version}}`.
`Food` adds: `aliases:[{alias,language,kind}]`, `portions:[{unit,quantity,grams,portionSource}]`, `source:{name,version,foodCode,reference,importDate}` — mirrors domain `Food`/`FoodSource` (TGT-05, master §10/§11).
Portion units are `PortionUnit.name` strings from the domain enum; the mobile mapper uses `PortionUnit.values.byName` with an unknown-unit guard (skip + log, never crash).

Error envelope (all 4xx/5xx): `{"error":{"code":"FOOD_NOT_FOUND"|"VALIDATION_ERROR"|"RATE_LIMITED"|"INTERNAL","message":"...","requestId":"..."}}`. 5xx messages sanitized (no stack, no SQL).

Notes: `/v1/foods/categories` MUST be declared before `/v1/foods/:id` (Nest route-order). This shape serves both S1 mobile sync (catalog endpoint) and S2 retrieval (search endpoint, top-N via `limit`).

## 9. DB schema (Prisma — food layer only; NO user tables in S1)

```prisma
enum ImportStatus { Pending Committed Failed }
enum FoodStatus { Active Deprecated Merged }
enum AliasKind { alternate transliteration misspelling appTransliteration }

model ImportRun {
  id String @id @default(cuid())
  sourceName String            // "ethiopian-fct-2025"
  sourceVersion String         // "2025"
  sourceReference String       // full EPHI/FAO citation (ADR-0004)
  sourceUrl String?
  fileName String
  fileSha256 String
  extractSha256 String?
  rowCount Int
  status ImportStatus @default(Pending)
  notes String?
  startedAt DateTime @default(now())
  finishedAt DateTime?
  foods Food[]
  @@unique([sourceName, sourceVersion, fileSha256])   // idempotency gate
}

model Food {
  id String @id               // stable: seed slug when name-matches a bootstrap food, else "fct-<sourceFoodCode>"
  canonicalName String
  categoryCode String
  category FoodCategory @relation(fields:[categoryCode], references:[code])
  description String? region String? preparation String?   // master §11
  status FoodStatus @default(Active)
  verification String? confidence Float?                  // master §11 (S2+ semantics; schema-ready)
  defaultPortionUnit String
  defaultPortionQty Float @default(1)
  defaultPortionGrams Float
  per100gKcal Float per100gProtein Float per100gCarbs Float per100gFat Float
  per100gFiber Float? per100gSodiumMg Float?
  extraNutrients Json?        // documented keys (energyKj, ashG, calciumMg, ironMg, vitaminA_ug, ...); row-level provenance still applies
  importId String
  import ImportRun @relation(fields:[importId], references:[id])
  sourceFoodCode String @unique   // upsert key across re-imports
  aliases FoodAlias[] portions FoodPortion[]
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
  @@index([canonicalName]) @@index([categoryCode])
}

model FoodAlias {
  id String @id @default(cuid())
  foodId String; food Food @relation(fields:[foodId], references:[id], onDelete: Cascade)
  alias String
  language String            // "en"|"am"|"om"
  kind AliasKind @default(alternate)
  normalized String          // lower + collapse whitespace; searched via ILIKE
  @@unique([foodId, alias, language]) @@index([normalized])
}

model FoodPortion {
  id String @id @default(cuid())
  foodId String; food Food @relation(fields:[foodId], references:[id], onDelete: Cascade)
  unit String                // PortionUnit.name
  quantity Float @default(1)
  grams Float
  portionSource String @default("nourish-standard")   // honesty: gram weights are NOT FCT data
  @@unique([foodId, unit])
}

model FoodCategory { code String @id label String }
```

**Explicit non-schema:** users/profiles/meals/etc. are NOT created in S1 (master §9 list is the
eventual target; slices add tables as behaviors land — users arrive with S3). No hidden tables.
Corrections-capture needs (S2/SAFE-07) are preserved by stable food ids + Deprecated-not-deleted
supersession.

## 10. FCT import pipeline spec

Stages (CLI `src/cli/import-fct.ts`, never HTTP):
1. **Acquire (T1):** download the official PDF from the EPHI/FAO URL recorded in
   `prisma/fixtures/README.md`; record URL + download date + sha256. If EPHI URL rots, use the
   FAO openknowledge bitstream. (Acquisition VERIFIED obtainable at plan time — see §0.)
2. **Extract:** `scripts/extract-fct.mjs` (pdfjs-dist) → `fct-2025-extract.jsonl`, one row per
   food: `{sourceFoodCode, nameEn, nameAm?, per100g:{...}, reference}`. Deterministic; logs row
   count. `scripts/verify-extract.mjs` asserts row count against the published table count and
   spot-checks N rows against the PDF (output recorded in README).
   **Fallback:** if automated PDF extraction proves unreliable, ship the
   `fct-2025-fixture-subset.jsonl` — the subset of the ~20 S0 foods present in FCT 2025,
   hand-transcribed with double-entry verification and page/code citations — and record
   full-dataset extraction as a TRACKED BLOCKER owned by @architect/@researcher (D5, never
   silently faked). Pipeline + schema are identical either way.
3. **Validate:** `FctRowValidator` — required fields; numeric bounds (kcal 0–900/100g, macros
   non-negative, sums sanity); code uniqueness. Any failure → ImportRun `Failed` + report, zero
   rows changed (atomicity, A22).
4. **Canonicalize:** `Canonicalizer` normalizes names; generates aliases — lowercase + variants
   (`doro we't`/`doro wet`), curated Amharic aliases (from the S0 set where the food matches),
   and rule-based Geez↔Latin transliterations tagged `kind: appTransliteration` (aliases are
   search infrastructure, explicitly NOT FCT nutrition data). `CategoryMapper` assigns
   Ethiopian/Breakfast/Lunch/Dinner/Snacks from a committed rule table. `PortionStandards`
   assigns default portion + portion table per food family (wot → cup 240g/ladle 100g; injera →
   injera 150g — mirrors S0 standards) with `portionSource: nourish-standard` (D3).
5. **Import (idempotent, version-gated):** unique `(sourceName, sourceVersion, fileSha256)` gate
   — same triple → skip (no-op). New sha256 → new ImportRun; transactional upsert keyed by
   `sourceFoodCode`; codes absent from the new extract → `status: Deprecated` (never deleted —
   preserves history references + S2 corrections-capture). Post-commit: mark Committed, compute
   catalog version `sha256(importId + canonical JSON)`.
6. **Verify:** post-import assertions — counts match extract; provenance non-null everywhere;
   sample rows byte-equal to extract (§15 parity spec).

Re-import upgrade path doubles as the FCT-2026+ path: new sourceVersion is just another run.
Stable food ids (`fct-<code>`, seed slugs where matched) keep meal-item references and future
correction records intact across upgrades (TGT-04 server-side guarantee once meals exist in S3).

## 11. Mobile sync/cache design

- **Seam:** `CatalogDataSource` interface. `LocalCatalogDataSource` = today's FoodDao logic
  (moved, not rewritten). `ApiCatalogDataSource` = `http` pkg, GET `/v1/catalog` with
  `If-None-Match`; base URL via `String.fromEnvironment` (no new plugin; `http` is pure Dart).
- **Sync policy:** bootstrap fires `CatalogSyncService.sync()` fire-and-forget AFTER the seed
  import (Home must not block — master §62). Success → single Drift transaction replaces the
  catalog with the snapshot, writes `seed_meta['catalog_version']` + `catalog_source`; failure
  (SocketException/timeout/non-2xx) → log category `catalog-sync`, keep seed (OFF-01). No
  periodic sync, no sync UI in S1 (features/screens untouched). Sync is S3's user-data concern;
  this is catalog-only.
- **Version gate:** skip when stored `catalog_version` == server version; conditional GET 304
  handled the same way.
- **Offline detection:** no connectivity plugin — "offline" = the network attempt failed. Search
  ALWAYS reads the local datasource (LOG-05/OFF-01); the API is only ever written INTO the cache.
- **Seed relabel:** `provisional-seed` → `provisional-seed-bootstrap`; search footer copy swaps
  post-sync from the provisional disclaimer to the FCT citation (honest voids pattern).
- **Id stability:** FCT foods whose canonical name matches a bootstrap seed food keep the seed
  slug as id (e.g. `injera`) so S0 meal-item `foodId` references stay resolvable; new foods get
  `fct-<code>`.
- **Drift v2 migration:** add nullable `sourceFoodCode`, `sourceReference`, `importDate` to
  `Foods` (additive; on-device upgrade safe). `SeedMeta` reused for catalog keys (no new table).
- **Zero-egress guarantee (revised):** S0 paths stay egress-free; network calls are confined to
  `lib/data/sources/` + `lib/data/sync/` + the one bootstrap call. Verified by grep gate (A14)
  and by tests that never touch a real socket (fake datasource everywhere).

## 12. Provider graph deltas (mobile)

```
clockProvider                    (NEW, Provider<Clock> — M3; overridable in tests)
catalogSyncServiceProvider       (NEW ← driftDatabaseProvider + ApiCatalogDataSource)
catalogSyncStateProvider         (NEW Notifier<CatalogSyncState>)
foodRepositoryProvider           (UNCHANGED signature; internals ← CatalogDataSource)
todayMealsProvider / todayWaterProvider  (MOD: date keys via clockProvider — M3)
onboardingControllerProvider     (M1: controller now constructor-injects repositories)
```
Everything else untouched. Graph stays strictly top-down, acyclic.

## 13. Security implications + Gate D checklist (S1 RE-OPENS Gate D)

- Public **read-only** surface only: all five routes are GET; no auth, no mutation endpoints.
- **No user data reaches the backend:** schema has no user tables; request logs never persist
  query strings (rate-limit keys are IP-only, transient).
- Rate limiting: @nestjs/throttler global (60/min/IP default; config via env).
- Input validation: whitelisted query params; `q` ≤ 100 chars; category enum whitelist;
  page/limit clamped; DTO validation → 400 envelope.
- Query safety: Prisma parameterized queries exclusively; no raw SQL, no interpolation (grep
  gate: no `$queryRaw`/`$executeRaw`).
- CORS: allowlist only (dev `http://localhost:*` + `app.nourish` origins via env; NO wildcard in
  production config).
- Secrets: `.env` gitignored (root .gitignore verified covers `.env`, `.env.*`, `*.pem`, `*.key`);
  only `.env.example` committed; no credentials in code/CI files.
- Containerized dev: Postgres bound to localhost; compose has no host secrets.
- Helmet + JSON body limits + sanitized 5xx.
- Dependency hygiene: `npm audit` in CI; lockfile committed.
- Gate D output: checklist evidence + `npm audit` + e2e security spec + schema grep + zero-egress
  grep on mobile.

## 14. Observability/logging

- API: Nest built-in Logger, structured categories (`import`, `foods.search`, `catalog`,
  `bootstrap`), request-id interceptor (echo `X-Request-Id`). No PII exists to leak in S1
  (public catalog only).
- **Sentry: API-only, DSN-gated** — recommendation YES (master §54 names Sentry; S1 has zero
  user data so SAFE-02's "no raw sensitive nutrition data to third parties" is trivially
  satisfied — catalog data is public by design). Disabled entirely when `SENTRY_DSN` unset (D4).
- Mobile: unchanged (local `dart:developer` logs; NO analytics/telemetry — S0 zero-egress paths
  preserved; mobile Sentry deferred to S3+ with SAFE-02 event shaping).

## 15. Test matrix (mapped to behavior IDs)

| Behavior / item | Test(s) | Where | Command |
|---|---|---|---|
| TGT-05 (canonical resolution + provenance) | alias resolution EN+AM → same id; provenance non-null | foods.e2e | `npm run test:e2e` |
| TGT-05 (mobile) | post-sync search returns FCT food w/ source block | offline_search_fallback_test | `flutter test` |
| TGT-02 | portions per food returned w/ portionSource; grams never hardcoded in API | foods.e2e | `npm run test:e2e` |
| LOG-05 | q/category/pagination/no-match; mobile seed+FCT search unchanged | foods.e2e + existing S0 tests | both |
| OFF-01 | seed-only offline search; failed sync keeps seed; synced snapshot offline | catalog_sync + offline fallback tests | `flutter test` |
| SAFE-02 (API side) | 429 burst; 400 invalid; CORS headers; helmet; no user tables grep | security.e2e | `npm run test:e2e` |
| Import idempotency (A4) | same sha → skip, single ImportRun | imports.e2e | `npm run test:e2e` |
| Import supersession (A5) | new sha → upsert + Deprecate stale | imports.e2e | `npm run test:e2e` |
| Import atomicity (A22) | invalid row → Failed, 0 changes | imports.e2e | `npm run test:e2e` |
| Fixture honesty (A3) | DB values == staged extract rows | fixture-parity.spec | `npm test` |
| Canonicalizer | variant + Amharic alias generation rules | canonicalizer.spec | `npm test` |
| M1 | circular import gone | analyze | `flutter analyze` |
| M2 | two-snack slot → aggregated kcal + both names | home_meals_totals_test | `flutter test` |
| M3 | midnight crossing recomputes day key | clock_provider_test | `flutter test` |
| M5/M6/M7 | dead code gone; notifications copy; welcome scrolls | analyze + widget tests | `flutter analyze` + `flutter test` |
| Regression | all 127 S0 tests green | full suites | `flutter test` (3 packages) |

Quality gates: `npm run lint` + `npm run build` clean; `npx prisma validate`; `flutter analyze`
0 issues; `flutter test` 127+; `npm audit` 0 high/critical; grep gates (A14, raw-SQL, STUB/TODO,
env secrets).

**Test DB strategy (architect amendment 1):** `test/setup.ts` provisions a dedicated
`nourish_test` database, applies `prisma migrate deploy` per run, and truncates all tables
between suites; CI uses GitHub Actions Postgres service containers; local e2e runs against the
compose Postgres (`postgres:16-alpine`).

## 16. Migration/rollback

- **API DB:** migrations additive (`prisma migrate dev`); import rollback = delete foods of the
  offending ImportRun + restore prior Committed run (documented reverse in imports.service).
  Dev reset: `npx prisma migrate reset`. Rollback = revert slice commits (execution contract).
- **Mobile:** Drift v1→v2 is additive nullable columns (on-device safe). Catalog rollback:
  remove `catalog_version` meta → next boot re-syncs; debug path: clear catalog + re-run
  SeedImporter (documented). Full rollback = revert commits; on-device data unaffected.
- Nothing merges to `main` without UAT (AGENTS.md §10).

## 17. Integration risks

1. **FCT extraction complexity (PDF → structured).** Mitigated: staged extract + verify script;
   fixture-subset fallback; blocker ownership; acquisition already proven public.
2. **Derived-data redistribution/licensing** of the extract commit — D1 resolved with factual
   attribution + sha256 provenance; the PDF itself is never committed.
3. **S0 regression.** Features untouched; repository public API unchanged; catalog swap is
   user-visible (search results change) → UAT note + disclaimer copy swap.
4. **Windows dev:** Docker daemon not running at plan time (CLI present). T0 gate: start Docker
   Desktop → `docker compose up`; fallback: native Postgres installer (psql absent today) or
   testcontainers in CI (service containers). Record whichever path ran.
5. **Node 24 + Nest/Prisma pinning** — resolve at scaffold; commit package-lock.json.
6. **Public read-only surface abuse** — rate limit + validation + query caps (A8/A10).
7. **graphify unavailable** — limitation recorded (Gate E).
8. **Bootstrap relabel ripple** — any string referencing `provisional-seed` updated in one pass
   (grep gate); tests assert both pre-sync and post-sync footers.

## 18. Deferred to S2+

Auth/OTP + user tables + OFF-02 user-data sync (S3); BullMQ queue code (S3; D2); AI retrieval
integration (S2 — search shape reserved); corrections capture UI/admin (SAFE-07; schema
compatible); pg_trgm/full-text or Typesense; custom foods (P-LOG-4); food details/portion-edit
screens; mobile Sentry/analytics; R2 imagery; website/release infra (S5).

## 19. Definition of Done

Blueprint approved by @architect → PLANNED → IMPLEMENTING. After implementation: all §4
criteria evidenced (commands + outputs recorded); `npm run lint`/`build`/`test`/`test:e2e` green;
`npx prisma validate`; `flutter analyze` 0 issues; `flutter test` 127+ incl. new S1 tests; grep
gates pass (egress confinement, raw-SQL, STUB/TODO, secrets); Gate D checklist completed +
`SECURITY PASS` recorded; integration verified (api+mobile contracts); atomic commit on
`feat/nourish-mvp`; STATE.md updated by @scribe; UAT note appended (catalog swap visible).

## 20. Planning quality gates (self-review)

- **No circular dependency:** api → (nothing shared); mobile → domain/design-system + local
  datasource; no code edge api↔mobile (network contract only). PASS.
- **Every acceptance criterion has a verification method:** §4 table maps A1–A22 to commands.
  PASS.
- **No hidden behavior:** fixture honesty rule, portion provenance label, bootstrap relabel, and
  deferred items all documented; nothing invented. PASS.
- **No scope expansion:** S2/S3 work explicitly deferred (§18); maintenance items are QA
  findings, not new features. PASS.
- **No unjustified monolith:** stage-decomposed import modules; max file ~350 lines. PASS.

## Decisions requested — RESOLVED by @architect 2026-08-26 (Gate A)

- **D1 — APPROVED with condition.** Commit the verified staged JSONL extract + the ~20-food verified fixture subset with full citation (EPHI/FAO 2025) + sha256 + acquisition URLs in `prisma/fixtures/README.md`. Do NOT commit the PDF. The README must also record the published licensing/attribution statement for the FCT 2025 publication (state it factually, e.g. published by EPHI & FAO, attribution as cited; if the license is not determinable, write "license not stated on source — attribution preserved" rather than inventing a license).
- **D2 — APPROVED.** Redis provisioned in compose only; zero queue code in S1. BullMQ arrives with S3.
- **D3 — APPROVED.** `portion_source: nourish-standard` label for Nourish-defined gram weights; FCT supplies per-100g nutrition only. This protects the never-present-as-authoritative rule.
- **D4 — APPROVED.** Sentry for `apps/api` only, DSN-gated, fully disabled when `SENTRY_DSN` unset. No mobile telemetry in S1.
- **D5 — APPROVED with escalation conditions.** If full PDF extraction slips, S1 may ship on the verified fixture subset ONLY IF: (a) the subset is double-entry-verified with page/food-code citations; (b) full extraction is recorded as an OPEN TRACKED BLOCKER owned by @architect/@researcher in STATE.md; (c) all UAT/release artifacts explicitly state data coverage (e.g. "20 of N foods") — the subset must never be presented as the full FCT 2025 catalog.

Tracking-only: **M4 (PPA-7 slot-row)** remains with @vision — no S1 engineering action.
