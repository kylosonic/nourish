# Gate C (QA) — Independent Functional Verification Report, Slice S1

- **Verdict: `QA REJECTED`**
- **Agent:** `@qa` (independent; not an author of this code)
- **Branch / HEAD verified:** `feat/nourish-mvp` @ `7817a9e` (HEAD unchanged throughout; no commit performed by QA)
- **Date:** 2026-09-19
- **Report author constraint honoured:** QA created exactly one file — this report. No repo file was edited, fixed, staged, committed, checked out, stashed or deleted. The `nourish_test` DB was mutated by the e2e suite only; the dev `nourish` DB was never reset.
- **Mid-run environment events (not QA's doing, recorded for provenance):** Docker Desktop + the API server restarted during verification (architect-reported). After restart QA re-verified container state, `healthz`, A6, categories, 404/400, catalog 304 and CORS — all re-confirmed. The architect also applied a fix for QA finding Q1 mid-run; every result below states whether it is pre-fix or post-fix.

---

## 1. Verdict and justification

**`QA REJECTED`.**

The engineering of this slice is, on the whole, strong: lint/build/schema are clean, the API unit suite is 19/19 and the e2e suite 31/31, the Flutter suites reproduce exactly (domain +27, design-system +13, mobile +107 → +111 post-fix), the live read-only API behaves to contract (A6 bilingual alias resolution, catalog 304 gate, 404/400/429 envelopes, CORS allowlist, helmet), the grep gates are genuinely zero, `.env` is properly ignored, the PDF is not committed, and the throttler is not bypassable via `X-Forwarded-For`.

**It is nevertheless rejected on the one thing this slice exists to guarantee: data honesty.** The committed FCT extract — the artifact the whole import chain, the API and the mobile cache are derived from — **mis-assigns the published nutrient columns**. I retrieved the FAO-published text layer of the *same* PDF the fixtures README cites and compared it against the extract. The proximate/macro block is perfect (18/18 foods match the publication exactly, including `kcal`, protein, fat, CHO and fibre), but the **mineral block is misaligned for all 18 imported foods**: the published `Calcium` column is dropped and every subsequent nutrient receives the *previous* nutrient's value. `doro_wot` therefore ships `sodiumMg: 0.62` where the FCT publishes `Na = 332` (0.62 is the *zinc* value); `egg` ships `ironMg: 138` where the FCT publishes `Fe = 1.8` (138 is the *phosphorus* value) and `sodiumMg: 0.97` where the FCT publishes `Na = 137` (0.97 is the *zinc* value); `injera` ships `sodiumMg: 0.23` where the FCT publishes `Na = 12`. The phytate/cholesterol block is misaligned too (for `egg`, the published `PHYTCPP = 0` and `CHOLE = 292` became `phytateMg: 292` and `cholesterolMg: 2.02`).

Critically, **A3's byte-parity gate passes and is genuinely implemented — and that is precisely why this escaped.** Parity is asserted only between the DB and the extract; nothing in the 50-test suite compares the extract to the publication. The `adb`/`verify-extract.mjs` "double-entry verification" cited in the fixtures README spot-checks only *code + kcal + name words* (`scripts/verify-extract.mjs:17`), so it cannot detect a nutrient-column misalignment by construction. The README's claim that "each value below appears identically in the positional PDF extract and FAO's text layer of the same page" is true for energy and false for minerals. Gate D's security pass and Gate E's integration pass both rested on this data being verified; it is not.

A second, independent integration defect was found and, during this verification, fixed by the architect: the mobile catalog mapper ignored the server's canonical `id`, producing **18/18 divergent food ids** (`injera` → `fct-010109`), which silently orphans S0 meal `foodId` references after the first real sync. QA reproduced that, notified the architect, and has now independently re-verified the fix (`0/18` mismatches, analyze clean, `+111` tests). That finding also **refutes the Gate E record's claim** that catalog↔mapper compatibility was verified; the mobile suite missed it because its sync tests construct `CatalogFood` objects directly and its one mapper test used a hand-written payload that does not occur in production.

Because the shipped nutrition data is a mis-transposition of its cited source, and because the repository currently contains a verification claim that this report falsifies, S1 must not be committed at Gate F until the extract is re-derived and re-verified. The fix is mechanical and the blast radius is well understood (see F-01).

---

## 2. Acceptance matrix A1–A22

Legend: **PASS** = independently reproduced by QA. All commands were run by QA in this session on the stated branch.

| # | Criterion | Status | Command run | Observed result |
|---|---|---|---|---|
| A1 | API boots against Postgres; `/v1/healthz` 200 with db status | **PASS** | `curl.exe -s -w " [HTTP %{http_code}]" http://localhost:3000/v1/healthz` | `{"status":"ok","service":"nourish-api","version":"0.1.0-s1","db":"up"} [HTTP 200]` |
| A2 | Fixture import commits N foods; non-null `source_name/version/food_code/reference/import_date` | **PASS** | `npm run test:e2e` (imports spec) + `curl.exe -s http://localhost:3000/v1/catalog` | e2e 31/31 green; QA independently confirmed all **18/18** catalog foods carry `foodCode` + `reference` + `importDate` (e.g. `kitfo=070153`, `doro_wot=070152`) |
| A3 | Nutrition values byte-equal to staged extract rows (never invented) | **FAIL** | `npm run test:e2e`; QA's own `psql` ↔ fixture comparison over all 18 foods | Literal DB↔extract parity **holds** (QA compared `kcal/protein/carbs/fat/fiber/sodium` for all 18 foods directly out of Postgres against the fixture file: 18/18 match; the single apparent difference, rice `sodiumMg` `"tr"` → `NULL`, is the documented `tr`→null transform and is correct). **However the criterion's honesty guarantee is defeated by F-01**: the staged extract itself mis-assigns published nutrient columns for 18/18 foods, so "byte-equal to the extract" no longer means "faithful to the cited source". Marked FAIL on intent — see F-01. |
| A4 | Re-running the import with same (source, version, sha256) is a no-op | **PASS** | `npm run test:e2e` | `[Nest] LOG [import] idempotent skip {"sha256":"BED96CE…","importId":"cmu5wmiqb00eqsovkcrw9tvip"}` |
| A5 | New extract sha256 supersedes in place; stale codes → Deprecated, never deleted | **PASS** | `npm run test:e2e` | `[Nest] LOG [import] committed {"importId":"cmu5wmj1600m3sovkhinl3egm","upserted":17,"deprecated":1}` |
| A6 | `GET /v1/foods?q=doro+wet` and `?q=ዶሮ ወጥ` return the same canonical food | **PASS** | `curl.exe -s "http://localhost:3000/v1/foods?q=doro+wet"` and `…?q=%E1%8B%B6%E1%88%AE%20%E1%8B%88%E1%8C%A5` | Both returned `"id":"doro_wot"`, `total=1`, identical payload (re-confirmed after the mid-run server restart) |
| A7 | Category filter, pagination (`meta.total`/`hasNextPage`), bounds (`limit` ≤ 100, `q` ≤ 100) | **PASS** | `curl.exe -s "…/v1/foods?category=ethiopian"`, `?limit=5&page=2`, `?limit=5&page=4`, `?limit=0`, `?page=0`, `?category=bogus` | `category=ethiopian` → `total=9`, all categories `Ethiopian`; `limit=5&page=2` → `returned=5 total=18 hasNextPage=True`; `page=4` → `returned=3 hasNextPage=False` (18 = 5+5+5+3, boundary math correct); `limit=0`/`page=0`/`category=bogus` → 400 `VALIDATION_ERROR` |
| A8 | Unknown id → 404 envelope; bad query → 400 field errors; burst → 429 | **PASS** | `curl.exe -s -w "…%{http_code}" …/v1/foods/nope-xyz`, `?limit=999`, `?q=<101 chars>`, 75-request burst | 404 `{"error":{"code":"FOOD_NOT_FOUND","message":"Food 'nope-xyz' not found","requestId":"3ed661a5…"}}`; 400 `"limit must be at most 100"`; 400 `"q must be at most 100 characters"`; burst → **HTTP 200 ×60 then 429 ×15** (first 429 at request #61) with `{"error":{"code":"RATE_LIMITED",…}}` and `Retry-After: 60` |
| A9 | `GET /v1/catalog` full snapshot with version + sha256; `If-None-Match` → 304 | **PASS** | `curl.exe -s http://localhost:3000/v1/catalog`; then `-H "If-None-Match: $version"` | `{"version":"6cd950b7…","generatedAt":"2026-08-27T12:38:43.716Z","sha256":"01f21800…","foods":[…18…]}`; conditional GET → **304**. Repeat fetch byte-identical (`body_identical=True`) — version/sha256/generatedAt are derived from the `ImportRun`, not wall-clock, so the 304 gate does not flap. Response `ETag` == `version` |
| A10 | CORS allowed origins only; helmet headers; OPTIONS preflight | **PASS (with F-07)** | `curl.exe -s -i -X OPTIONS …/v1/foods -H "Origin: http://localhost:5173"`; same with `Origin: http://evil.example`; `-D -` on `GET /v1/foods` | Allowed: `204` + `Access-Control-Allow-Origin: http://localhost:5173` + `Allow-Methods: GET,OPTIONS` + `Max-Age: 86400`. Evil origin: preflight `404`, GET `200` with **no** `Access-Control-Allow-Origin`. Helmet present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, plus CSP/Referrer-Policy/X-DNS-Prefetch/X-Permitted-Cross-Domain-Policies. **Caveat:** the allowlist matcher is defeatable — see F-07 |
| A11 | No user/profile tables; only food-layer + imports models | **PASS** | `Select-String -Path apps\api\prisma\schema.prisma -Pattern '^(model\|enum)\s+\w+'`; regex sweep for user/profile/meal/subscription/account/auth/session/payment/order/plan/weight/water/target models; `npx prisma validate` | Models: `ImportRun, Food, FoodAlias, FoodPortion, FoodCategory` (+ enums `ImportStatus/FoodStatus/AliasKind`) — exactly the blueprinted set. Sensitive-name sweep: **ZERO MATCHES**. `prisma validate` → `The schema at prisma\schema.prisma is valid 🚀`. Raw SQL sweep (`$queryRaw\|$executeRaw\|$queryRawUnsafe\|$executeRawUnsafe` over `apps/api/src`): **ZERO MATCHES** |
| A12 | Mobile: zero-network seed search; post-sync FCT snapshot searchable offline; failed sync keeps seed | **PASS (narrow — see F-03)** | `flutter test` in `apps/mobile` | `+107: All tests passed!` pre-fix, `+111: All tests passed!` post-fix, incl. `offline_search_fallback_test.dart` and `catalog_sync_test.dart:235` (`the synced catalog is preserved on failure`). **Narrow:** these use fake snapshots; the real payload integration was broken (F-03) and is now fixed and covered by a real-capture contract test |
| A13 | Sync is version-gated (same `catalog_version` → no-op) | **PASS** | `flutter test` (`catalog_sync_test.dart`) | `304 / not-modified: stored catalog untouched, state synced` and `server returns the same version: no replace happens` — both green; QA read `catalog_sync_service.dart:36-55` and confirms the gate is a plain string compare against `storedVersion()` (no date/clock involved, so no timezone exposure) |
| A14 | Zero-egress confinement: `http`/`dart:io`/`HttpClient` only under `lib/data/sources/`+`lib/data/sync/` | **PASS** | `Get-ChildItem -Recurse apps\mobile\lib -Include *.dart \| Select-String -Pattern 'dart:io\|HttpClient\|package:http\|Socket\|InternetAddress\|WebSocket\|dart:html'` | **Exactly one match:** `apps/mobile/lib/data/sources/api_catalog_data_source.dart:4: import 'package:http/http.dart' as http;` — inside the permitted `data/sources/` seam. No `dart:io`, no `HttpClient`, no sockets anywhere in `lib` |
| A15 | Existing 127 S0 tests stay green; `flutter analyze` clean | **PASS** | `dart analyze` + `flutter test` (§1 commands below) | domain `No issues found!` / `+27`; design-system `No issues found!` / `+13`; mobile `No issues found!` / `+107` (→`+111` post-fix). Total **147 → 151**, i.e. 127 S0 tests all green with no regressions |
| A16 | M1 circular import gone | **PASS** | `Select-String -Path apps\mobile\lib\features\onboarding\onboarding_controller.dart -Pattern 'import'` | Imports are `flutter/foundation`, `flutter_riverpod`, `nourish_domain`, `../../data/repositories/onboarding_repository.dart`, `target_repository.dart`, `../../l10n/strings.dart`. **No `providers.dart` import**; the file-level cycle is gone (controller now constructor-injects repositories) |
| A17 | M2 HOME-03 multi-items-per-slot totals widget test exists and passes | **PASS** | `flutter test` | `home_meals_totals_test.dart: HOME-03 multi-items-per-slot totals two snacks in one slot aggregate into one row with both names` + `different slots keep separate rows (no cross-slot merging)` — green |
| A18 | M3 clock injectable; midnight crossing recomputes day key | **PASS** | `flutter test` | `clock_provider_test.dart: todayDateKey recomputes the day key across midnight`, `todayMealsProvider selects its day through the injected clock`, `todayMealsProvider ignores meals on the real wall-clock day` — green. `lib/core/clock.dart` present |
| A19 | M5 `honestVoidFeatures` removed (or wired); no unused-declaration warnings | **PASS** | `Get-ChildItem -Recurse apps\mobile\lib,test -Include *.dart \| Select-String -Pattern 'honestVoidFeatures'`; `flutter analyze` | **ZERO MATCHES**; `flutter analyze` → `No issues found!` (0 issues) |
| A20 | M6 notifications void renders dedicated copy | **PASS** | `flutter test` | `notifications_void_test.dart: M6 notifications void copy notifications icon renders the dedicated void copy` — green |
| A21 | M7 welcome content scrolls on short viewports (320×480) | **PASS** | `flutter test` | `welcome_scroll_test.dart: M7 welcome scroll 320×480: both buttons are reachable and work` — green |
| A22 | Import failure is atomic: invalid extract row → `ImportRun` `Failed`, zero food changes | **PASS** | `npm run test:e2e` | `[Nest] ERROR [import] validation failed {"importId":"cmu5wmjf400t0sovk0l7tnjuj","errors":1}` and the spec asserts `expect(after).toEqual(before); // byte-identical — nothing changed` |

**Matrix summary: 20 PASS, 1 FAIL (A3), 0 NOT VERIFIED** — but the single FAIL is a data-integrity BLOCKER that invalidates the slice's central claim.

---

## 3. Smoke evidence (live API, `http://localhost:3000`)

All bodies below are verbatim (trimmed only where marked). Re-verified after the mid-run restart.

```
$ curl.exe -s -w " [HTTP %{http_code}]" http://localhost:3000/v1/healthz
{"status":"ok","service":"nourish-api","version":"0.1.0-s1","db":"up"} [HTTP 200]

$ curl.exe -s "http://localhost:3000/v1/foods?q=doro+wet"
{"data":[{"id":"doro_wot","canonicalName":"Chicken, meat, without skin, stew, with onion, oil, egg, spices, butter and salt",
 "category":"Ethiopian","defaultPortion":{"unit":"cup","quantity":1,"grams":240},
 "per100g":{"kcal":219,"proteinG":6.8,"carbsG":5.1,"fatG":18.4,"fiberG":2.9,"sodiumMg":0.62},
 "source":{"name":"ethiopian-fct-2025","version":"2025"}}],"meta":{"page":1,"limit":20,"total":1,"hasNextPage":false}}

$ curl.exe -s "http://localhost:3000/v1/foods?q=%E1%8B%B6%E1%88%AE%20%E1%8B%88%E1%8C%A5"   # ዶሮ ወጥ
{"data":[{"id":"doro_wot", …identical payload… }],"meta":{"page":1,"limit":20,"total":1,"hasNextPage":false}}   # A6 ✔ same id

$ curl.exe -s http://localhost:3000/v1/foods/categories
{"data":["Ethiopian","Breakfast","Lunch","Dinner","Snacks"]}

$ curl.exe -s http://localhost:3000/v1/foods/doro_wot            # full Food
{"id":"doro_wot","canonicalName":"Chicken, meat, without skin, stew, with onion, oil, egg, spices, butter and salt",
 "category":"Ethiopian","defaultPortion":{"unit":"cup","quantity":1,"grams":240},
 "per100g":{"kcal":219,"proteinG":6.8,"carbsG":5.1,"fatG":18.4,"fiberG":2.9,"sodiumMg":0.62},
 "source":{"name":"ethiopian-fct-2025","version":"2025","foodCode":"070152",
   "reference":"Ethiopian Public Health Institute (EPHI) and Food and Agriculture Organization of the United Nations (FAO) 2025. The Ethiopian Food Composition Table 2025. Addis Ababa, Ethiopia.",
   "importDate":"2026-08-27T12:38:43.140Z"},
 "aliases":[{"alias":"doro wet","language":"en","kind":"alternate"},{"alias":"doro we't","language":"en","kind":"alternate"},
   {"alias":"ዶሮ ወጥ","language":"am","kind":"alternate"},{"alias":"Doro wot","language":"am","kind":"alternate"},
   {"alias":"እንቁላል","language":"am","kind":"appTransliteration"}, … ],
 "portions":[{"unit":"cup","quantity":1,"grams":240,"portionSource":"nourish-standard"},
   {"unit":"bowl","quantity":1,"grams":300,"portionSource":"nourish-standard"},
   {"unit":"ladle","quantity":1,"grams":100,"portionSource":"nourish-standard"}]}
# aliases[] , portions[] with portionSource, and the full source block all present per §8.

$ curl.exe -s -w " [HTTP %{http_code}]" http://localhost:3000/v1/foods/nope-xyz
{"error":{"code":"FOOD_NOT_FOUND","message":"Food 'nope-xyz' not found","requestId":"3ed661a5-d4d8-4d26-8430-0189f15f6ed3"}} [HTTP 404]

$ curl.exe -s -w " [HTTP %{http_code}]" "http://localhost:3000/v1/foods?limit=999"
{"error":{"code":"VALIDATION_ERROR","message":"limit must be at most 100","requestId":"fe4dc67a-…"}} [HTTP 400]

$ curl.exe -s -w " [HTTP %{http_code}]" "http://localhost:3000/v1/foods?q=aaaaaaaa…(101 chars)"
{"error":{"code":"VALIDATION_ERROR","message":"q must be at most 100 characters","requestId":"e84050e3-…"}} [HTTP 400]

$ curl.exe -s http://localhost:3000/v1/catalog
{"version":"6cd950b7cb12acb986ce18239a3b68269672c1eba543bc682fb4b77389e809e5",
 "generatedAt":"2026-08-27T12:38:43.716Z",
 "sha256":"01f21800cc980d3bca43f4f4f9d6b44023811726b4cd26fdae308375e5c50b40",
 "foods":[{"id":"kitfo","canonicalName":"Beef, meat, lean, minced, cooked with butter, spices and salt", …}, … 18 total]}
# response headers: ETag: 6cd950b7…  Cache-Control: no-cache  X-RateLimit-Limit: 60
$ curl.exe -s -o NUL -w "%{http_code}" -H "If-None-Match: 6cd950b7cb12acb986ce18239a3b68269672c1eba543bc682fb4b77389e809e5" http://localhost:3000/v1/catalog
304                                     # A9 ✔

# Rate limit (run LAST, 75 sequential GETs)
FIRST 429 AT REQUEST #61
BODY: {"error":{"code":"RATE_LIMITED","message":"Too many requests. Please slow down.","requestId":"584cf1f3-…"}}
tally: HTTP 200 : 60 | HTTP 429 : 15        # A8 ✔
429 headers: Retry-After: 60
$ curl.exe -s http://localhost:3000/v1/healthz     # while throttled
{"status":"ok","service":"nourish-api","version":"0.1.0-s1","db":"up"}   # healthz exempt ✔

# CORS preflight
$ curl.exe -s -i -X OPTIONS …/v1/foods -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET"
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,OPTIONS
Access-Control-Allow-Headers: Content-Type,If-None-Match,X-Request-Id
Access-Control-Max-Age: 86400
Vary: Origin
$ curl.exe -s -i -X OPTIONS …/v1/foods -H "Origin: http://evil.example"     → HTTP/1.1 404 Not Found  (no ACAO)
$ curl.exe -s -i "…/v1/foods?limit=1" -H "Origin: http://evil.example"      → HTTP/1.1 200 OK          (no ACAO)

# Helmet (GET /v1/foods)
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self';base-uri 'self';…;upgrade-insecure-requests
Referrer-Policy: no-referrer | X-DNS-Prefetch-Control: off | X-Permitted-Cross-Domain-Policies: none
```

**Dev DB isolation (required check):** after `npm run test:e2e` completed against `nourish_test`,

```
$ docker exec nourish-postgres psql -U nourish -d nourish -tAc 'SELECT COUNT(*) FROM "Food";'
18
$ docker exec nourish-postgres psql -U nourish -d nourish_test -tAc 'SELECT COUNT(*) FROM "Food";'
18
```

The e2e suite did **not** touch the dev DB — it still holds exactly 18 foods (confirmed again after the container restart).

---

## 4. Grep-gate evidence

| Gate | Command | Match count | Matches |
|---|---|---|---|
| A11 models | `Select-String -Path apps\api\prisma\schema.prisma -Pattern '^(model\|enum)\s+\w+'` | 8 | `ImportStatus`(15), `FoodStatus`(21), `AliasKind`(27), `ImportRun`(34), `Food`(53), `FoodAlias`(86), `FoodPortion`(99), `FoodCategory`(111) — food layer only |
| A11 user tables | regex `(?i)model\s+\w*(user\|profile\|meal\|subscription\|account\|auth\|session\|payment\|order\|plan\|weight\|water\|target)\w*` on schema | **0** | — |
| Raw SQL | `Get-ChildItem -Recurse apps\api\src -Include *.ts \| Select-String -Pattern '\$queryRaw\|\$executeRaw\|\$queryRawUnsafe\|\$executeRawUnsafe'` | **0** | — |
| A14 egress | `… apps\mobile\lib -Include *.dart \| Select-String -Pattern 'dart:io\|HttpClient\|package:http\|Socket\|InternetAddress\|WebSocket\|dart:html'` | **1** | `apps/mobile/lib/data/sources/api_catalog_data_source.dart:4: import 'package:http/http.dart' as http;` (inside the permitted seam) |
| M1 | imports of `onboarding_controller.dart` | 6, none is `providers.dart` | `flutter/foundation`, `flutter_riverpod`, `nourish_domain`, `onboarding_repository.dart`, `target_repository.dart`, `l10n/strings.dart` |
| M5 | `… apps\mobile\lib,apps\mobile\test -Include *.dart \| Select-String -Pattern 'honestVoidFeatures'` | **0** | — |
| Markers | 141 files scanned across `apps/api/src`, `apps/mobile/lib`, `packages/*/lib`; case-**sensitive** `\bTODO\b`, `\bFIXME\b`, `//\s*STUB`, `\bPLACEHOLDER\b` | **0 / 0 / 0 / 0** | None. Note: a naive case-insensitive `TODO` grep yields 16 false positives from `toDouble()` and prose "placeholder art" — QA re-ran case-sensitively; the gate is genuinely clean |
| Secrets | `.env` tracked? `git ls-files \| Select-String '\.env'`; `git check-ignore -v apps/api/.env`; `git status --porcelain -uall \| Select-String 'env'` | see right | **No `.env` tracked.** `git check-ignore` → `.gitignore:27:.env  apps/api/.env` (ignored). `.env` never appears in `git status`. `apps/api/.env.example` → `.gitignore:29:!.env.example` (negation wins ⇒ **not** ignored, shows as `??` ⇒ will be committed by Gate F ✔). `apps/api/.env` on disk contains only local dev defaults (`postgresql://nourish:nourish@localhost:5432/nourish`, `SENTRY_DSN=` empty) — no real secret. Secret-pattern sweep over tracked files (`password=`, `API_KEY`, `SECRET=`, `PRIVATE KEY`, `AKIA…`, `sk-…`, `ghp_…`) matched **only `.opencode/skills/**` documentation** (third-party skill text, e.g. `spring.data.redis.password=rootroot` in a Spring skill) — **zero hits in `apps/`, `packages/`, `.github/`** |
| PDF not committed | `Get-ChildItem -Recurse -Include *.pdf` (excl. `.opencode`); `git ls-files \| Select-String '\.pdf$'`; `Test-Path apps/api/fct-downloads` | **0** | No PDF anywhere outside `.opencode`; zero tracked PDFs; no `fct-downloads/` directory. Fixtures README states the PDF is never committed ✔ |
| §6 file tree | directory listing of the blueprint's required paths | all present | `src/foods/{foods.controller,foods.module,foods.prisma-repository,foods.service}.ts` + `dto/{catalog,categories,food-query,food-summary,food}.dto.ts`; `src/imports/{canonicalizer,category-mapper,fct-parser,fct-row-validator,imports.module,imports.repository,imports.service,portion-standards,transliterator}.ts`; `src/cli/import-fct.ts`; `test/{catalog,security,imports,foods}.e2e-spec.ts`; `test/{canonicalizer,fct-row-validator,fixture-parity}.spec.ts`; `test/setup.ts`, `test/db-utils.ts`, `test/jest-e2e.json`; `scripts/{extract-fct,verify-extract}.mjs`; `prisma/{schema.prisma,seed.ts,migrations/…init_food_layer}`, `prisma/fixtures/*`; `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `.env.example`, `eslint.config.mjs`, `jest.config.js`, `nest-cli.json`, `tsconfig{,.build}.json`, `package-lock.json`; mobile **5** new files (`data/sources/{catalog_data_source,local_catalog_data_source,api_catalog_data_source}.dart`, `data/sync/{catalog_sync_service,catalog_sync_state}.dart`) and **6** new tests (`catalog_sync_test`, `clock_provider_test`, `home_meals_totals_test`, `offline_search_fallback_test`, `welcome_scroll_test`, `widget/notifications_void_test`) ✔ |
| Suite commands | `npm run lint` / `npm run build` / `npx prisma validate` / `npm test` / `npm run test:e2e` / `npm audit --audit-level=high` (in `apps/api`) | exit 0 / 0 / 0 / 0 / 0 / 0 | lint `=== LINT EXIT: 0 ===`; build `=== BUILD EXIT: 0 ===`; `The schema at prisma\schema.prisma is valid 🚀`; `Tests: 19 passed, 19 total`; `Tests: 31 passed, 31 total`; `found 0 vulnerabilities` (JSON: `"vulnerabilities":{}`, info/low/moderate/high/critical all 0, 783 deps) |
| CVE pins | `npm ls multer qs`; `npm ls @types/pg` | resolved | `multer@2.4.0` (≥2.4.0 ✔) and `qs@6.16.0` (deduped ×2, ≥6.16.0 ✔); `@types/pg@8.23.1` present. `overrides: {"multer":"^2.4.0","qs":"^6.16.0"}` confirmed in `package.json` |
| Flutter suites | `dart analyze` + `flutter test` (domain); `flutter analyze` + `flutter test` (design-system); `flutter analyze` + `flutter test` (mobile) | all exit 0 | domain: `No issues found!`, `+27: All tests passed!`; design-system: `No issues found! (ran in 4.3s)`, `+13: All tests passed!`; mobile: `No issues found! (ran in 8.3s)`, `+107: All tests passed!` → post-fix `No issues found! (ran in 3.6s)`, `+111: All tests passed!` |

---

## 5. Findings

### F-01 — BLOCKER — committed FCT extract mis-assigns the published nutrient columns (18/18 imported foods); wrong nutrition is live in the DB and API

- **Files:** `apps/api/prisma/fixtures/fct-2025-extract.jsonl`, `apps/api/prisma/fixtures/fct-2025-fixture-subset.jsonl` (data); `apps/api/scripts/extract-fct.mjs` (root cause); `apps/api/prisma/fixtures/README.md` (false verification claim); propagated to `Food.extraNutrients` / `Food.per100gSodiumMg` and `GET /v1/foods*`.
- **Evidence.** QA retrieved the FAO-published text layer of the *same* PDF the README cites (`https://openknowledge.fao.org/server/api/core/bitstreams/3389ccb5-03e0-437e-8800-8d22db3ff585/content`, 684,206 bytes) and compared it to the committed extract. The published mineral header is `Calcium Iron Magnesium Phosphorus Potassium Sodium Zinc Copper Manganese Selenium` with `INFOODS Tagnames CA FE MG P K NA ZN CU MN SE`.

  | food | published (Ca Fe Mg P K Na Zn Cu Mn Se) | what the extract claims |
  |---|---|---|
  | `070152` doro_wot | `24 1.2 16 85 167 332 0.62 0.09 0.25 6` | `calciumMg=1.2, ironMg=16, magnesiumMg=85, phosphorusMg=167, potassiumMg=332, sodiumMg=0.62, zincMg=0.09, copperMg=0.25, seleniumUg=6` |
  | `080001` egg | `38 1.8 11 138 108 137 0.97 0.05 0.02 28` | `calciumMg=11, ironMg=138, phosphorusMg=108, potassiumMg=137, sodiumMg=0.97, zincMg=0.05, copperMg=0.02, seleniumUg=28` |
  | `010109` injera | `66 11.1 76 118 156 12 1.20 0.23 3.99 10` | `calciumMg=76, ironMg=118, magnesiumMg=156, phosphorusMg=12, potassiumMg=1.2, sodiumMg=0.23, zincMg=3.99, copperMg=10` |

  In every case the extract's value list is an exact contiguous run of the published row that **starts at the published `Fe` or `Mg` column, never at `Ca`** — a systematic one-or-two-column left shift. The published **Calcium is always lost**, and each nutrient key receives a *different* nutrient's number. Automated contiguous-subsequence matching over all 18 imported foods returned **ALIGNED = 0, SHIFTED = 18** (offsets +1…+3).
  So `doro_wot` ships sodium `0.62` where the FCT publishes `332` (0.62 is the *zinc* value); `egg` ships iron `138` where the FCT publishes `1.8` (138 is the *phosphorus* value) and sodium `0.97` where the FCT publishes `137` (0.97 is the *zinc* value). The "implausible mineral magnitudes" the architect flagged are exactly this defect — they are not implausible FCT data.
  The phytate/cholesterol block is affected too: for `egg` the published row is `PHYTCPP=0, CHOLE=292, FASAT=2.02, FAMS=2.59, FAPU=1.26, F18D2CN6=0.96, F18D3CN3=0.03`; the extract claims `phytateMg=292` (= published cholesterol) and `cholesterolMg=2.02` (= published saturated fat). Automated comparison flagged **16/18 shifted** for this block (2 aligned; hence the architect's sampled values did *not* reveal it).
  **Confirmed live in the API:** `GET /v1/foods/doro_wot` → `"sodiumMg":0.62`. **Confirmed byte-identical in the DB:** `psql … SELECT "extraNutrients"->>'ironMg' … WHERE "sourceFoodCode" IN ('070152','080001')` → `070152|16|13|3.14|1.2` and `080001|138|292|2.02|11`.
  **Scope determination (important):** the proximate/macro block is **correct** — published `kJ(kcal), water, protein, fat, CHO, fibre, ash` matched the extract for **18/18** foods (incl. `070152 908(219) 64.2 6.8 18.4 5.1 2.9 2.6` and `080001 494(118) 78.5 11.3 7.1 2.3 0 0.8`). So the user-visible `kcal` and macros shipped in the app are trustworthy; the defect is confined to the mineral block and (mostly) the phytate/fatty-acid block, all of which land in `extraNutrients` except `sodiumMg`.
- **Impact:** the slice's stated honesty rule ("nutrition values come only from the verified FCT extract") is satisfied in form and violated in substance. `sodiumMg` is part of the public §8 `FoodSummary` contract and is served to the mobile catalog; the remaining mis-assigned minerals and phytate/cholesterol are persisted in `extraNutrients` and will be consumed by S2's nutrition engine and by any future UI. `README.md:60-61`'s claim that "each value below appears identically in the positional PDF extract and FAO's text layer of the same page" is **false for every mineral**.
- **Suggested fix:** (1) correct the positional value→tag alignment in `scripts/extract-fct.mjs` (the tag map at lines 69-78 is correct; the *alignment* of values to those tags is not — emitted rows carry 8-9 values for a 10-tag block, and the first published value is dropped); (2) re-run the extractor and **replace both committed JSONL files**; (3) re-run the import against a fresh DB state and re-verify parity; (4) add a targeted regression assertion for `070152`/`080001`/`010109` mineral values so the class of defect cannot silently return.
- **Blocks Gate F: YES.**

### F-02 — BLOCKER — the "double-entry verification against the FAO text layer" claim is refuted, and the verifier is structurally incapable of catching F-01

- **File:** `apps/api/scripts/verify-extract.mjs:11-17,102-142`; asserted in `apps/api/prisma/fixtures/README.md:14-15,55-61,60-61`.
- **Evidence.** The script's own header states its three checks: row count == 722, code uniqueness, and *"Spot-check: for every Nth row, the code + **kcal value** + first name words"* (`:17`). It compares `EXPECTED_TABLE_ROWS = 722` (`:51`), a stride of 40 (`:102`) and `fail('spot-check …: value ${expected} not found near code line in txt')` (`:135`) where the only value ever compared is energy. **No mineral, vitamin or fatty-acid column is compared anywhere in the script.** QA confirmed the macro block is exactly right and the mineral block exactly wrong — which is precisely the blind spot this verifier defines.
- **Impact:** the artifact UAT and Gate D/E rely on as "verification + provenance" does not verify the data it claims to. `README.md`'s "Double-entry verified" language must not survive into release artifacts in its current form.
- **Suggested fix:** extend `verify-extract.mjs` to compare **every** published column (or at minimum all columns of blocks 2/5 and 5/5) for a stratified sample plus the 18 fixture foods, failing loudly on any mismatch; and have the README state exactly which columns were compared and how many rows.
- **Blocks Gate F: YES** (the claim is part of the slice deliverable and is currently false).

### F-03 — MAJOR (FIXED and re-verified during this Gate C) — mobile catalog mapper ignored the server's canonical `id`; 18/18 ids diverged

- **File (pre-fix):** `apps/mobile/lib/data/sources/api_catalog_data_source.dart:119-122,166-173`.
- **Evidence (pre-fix).** `_mapFood` derived the id from `canonicalName` (exact match against `kSeedFoods` short names) + `source.foodCode`, and never read `json['id']`. The API returns the long FCT description as `canonicalName` (`"Enjera, teff, mixed"`, `"Chicken, meat, without skin, stew, …"`), so no seed name could match. QA simulated the mapper's own algorithm against the live `GET /v1/catalog`: **18/18 mismatches, 0 seed-name matches** — server `injera` → mapper `fct-010109`, server `doro_wot` → `fct-070152`, server `kitfo` → `fct-070153`. Because `replaceAll` deletes all `Foods` rows, S0 `MealItems.foodId` values would no longer resolve after the first real sync, contradicting blueprint §11 and the code's own comment. User-visible impact in S1 was nil (`MealItems.foodId` at `tables.dart:181` has no FK and history renders denormalized `foodName` + the stored snapshot). The mobile suite missed it because `catalog_sync_test.dart` builds `CatalogFood` objects directly and its single mapper test used a hand-written payload `'canonicalName': 'Injera'` that does not occur in production.
- **Fix applied by architect** (QA notified mid-run; QA did **not** author or apply it): `_mapFood` now prefers a non-empty `json['id']` and keeps the name/code derivation as an explicit fallback; new real-capture fixture `apps/mobile/test/fixtures/catalog_response.json` (18 foods, 19,790 bytes, version `6cd950b7…`); new `apps/mobile/test/catalog_mapper_contract_test.dart` (4 tests); the old mapper group renamed to make clear it covers the no-id fallback only.
- **QA independent re-verification (post-fix):** `flutter analyze` → `No issues found! (ran in 3.6s)`; `flutter test` → `+111: All tests passed!`; QA re-ran its **own** simulation of the new algorithm against the **live** API → **0/18 mismatches** (was 18/18). QA inspected the committed fixture: it really is a captured `/v1/catalog` payload carrying server ids (`kitfo,beef_tibs,bread,fuul,atkilt,chechebsa,doro_wot,buna,egg,injera,gomen,kik_alicha,misir_wot,milk,orange,pasta,shiro_wot,rice`) and the real FCT `canonicalName` values; and read `catalog_mapper_contract_test.dart` — it loads that fixture and asserts server-id preservation (`:40`), provenance (`:77-85`, `doro_wot` `foodCode == '070152'`, `kcal == 219`), and the no-id fallback (`:88`). The fix is genuine and adequate.
- **Related process defect:** the previous **Gate E record is refuted** — it claims catalog↔`CatalogFood` mapper compatibility was verified; it was not, and the test that appeared to cover it could not fail.
- **Blocks Gate F: NO** (fixed and independently re-verified).

### F-04 — MEDIUM — 8 of 70 catalog aliases are claimed by multiple foods, so common queries return the wrong top hit

- **Files:** `apps/api/src/imports/transliterator.ts` (word-map applied to the FCT *description*), consumed via `canonicalizer.ts:204-215`.
- **Evidence.** From the live `/v1/catalog` payload, QA counted cross-food alias collisions:

  ```
  am:ጨው       -> 11 foods (kitfo, beef_tibs, fuul, atkilt, doro_wot, gomen, kik_alicha, misir_wot, pasta, shiro_wot, rice)
  am:ሽንኩርት    -> 6 foods  (beef_tibs, atkilt, doro_wot, kik_alicha, misir_wot, shiro_wot)
  am:ቅቤ       -> 4 foods
  am:እንቁላል    -> doro_wot, egg
  am:ዶሮ        -> doro_wot, egg
  am:የበሬ ሥጋ    -> kitfo, beef_tibs
  am:ዳቦ        -> bread, chechebsa
  am:ጎመን       -> atkilt, gomen
  ```
  8 of 70 distinct aliases collide. Reproduction:
  ```
  $ curl.exe -s "http://localhost:3000/v1/foods?q=%E1%8A%A5%E1%8A%95%E1%89%81%E1%88%8B%E1%88%8D"   # እንቁላል = "egg"
  total=2  ->  doro_wot  (canonicalName "Chicken, meat, without skin, stew, …")
           ->  egg
  ```
  A user searching the Amharic word for **egg** gets *Chicken stew* first (ordering is `canonicalName asc`, "Chicken…" < "Egg…"). The alias generator transliterates **every word of the FCT ingredient description** into Geez, so composite dishes inherit their ingredients' names (`ጨው` = salt is an alias of 11 foods). These aliases are tagged `kind: appTransliteration` although they are word-level *translations*, not transliterations.
- **Impact:** degraded canonical-resolution precision — the exact capability this slice exists to provide — and it will feed S2's AI retrieval, which searches through this endpoint. It does not break A6 (the curated seed alias `ዶሮ ወጥ` is `kind: alternate` and resolves uniquely).
- **Suggested fix:** generate aliases from the **head noun / dish name only**, not the full ingredient list; exclude stop-word ingredients (salt, oil, water, onion, butter); or rank `alternate` aliases above `appTransliteration` matches so curated names win. Add a test asserting that a query for a common ingredient word does not outrank an exact canonical match.
- **Blocks Gate F: NO** (quality defect, no honesty violation; recommend a tracked follow-up before S2 retrieval depends on it).

### F-05 — MEDIUM — a partial/mangled snapshot can replace a good cached catalog, and the snapshot's `sha256` is never verified

- **Files:** `apps/mobile/lib/data/sources/api_catalog_data_source.dart:149-151` (parses `sha256`, never checks it), `:140-142` (only guard is `foods.isEmpty`), `apps/mobile/lib/data/sources/local_catalog_data_source.dart:101-132` (`replaceAll` deletes all foods then inserts).
- **Evidence.** `mapCatalogSnapshot` skips individually-unusable foods with a log and only throws when **zero** foods survive. A payload that parses as JSON and yields a single valid food is therefore accepted, and `replaceAll` then deletes the entire previous catalog (including the 20-food S0 seed) in one transaction and writes that one food. The API computes and returns a `sha256` of the canonical payload (`foods.service.ts:116`) — the client carries it in `CatalogSnapshot.sha256` and **never compares it to anything** (grep for `sha256` in `apps/mobile/lib` returns only the parse and the field declaration). There is no minimum-count or shrink guard.
- **Impact:** silent catalog degradation from a truncated response, a misbehaving proxy or a corrupted cache. Low exploitability today (the server is first-party and the transport is HTTP on localhost in dev), but it is a durability gap in the offline-cache contract (OFF-01) and the integrity primitive is already being transmitted unused.
- **Suggested fix:** verify `sha256` over the canonical payload when present and reject on mismatch; additionally refuse a replacement that shrinks the catalog by more than a bounded ratio without an explicit override. `replaceAll`'s transaction ordering (delete→insert in one transaction) is already correct — a mid-insert throw rolls back.
- **Blocks Gate F: NO.**

### F-06 — MEDIUM — `extraNutrients` is covered by no parity test, so F-01-class defects in the mineral block are untestable

- **Files:** `apps/api/test/fixture-parity.spec.ts:62-67`, `apps/api/test/imports.e2e-spec.ts:115-129`.
- **Evidence.** Both parity tests compare exactly six fields — `kcal, proteinG, carbsG, fatG, fiberG, sodiumMg`. A grep for `extraNutrients|ironMg|phytate|cholesterol|calciumMg` across `test/imports.e2e-spec.ts` returns **ZERO MATCHES**. Every mis-assigned mineral except sodium lives only in `extraNutrients`, so an invented *or* mis-mapped mineral value would pass all 19 unit + 31 e2e tests. (QA independently confirmed the DB values for `070152`/`080001` *do* equal the fixture bytes — parity holds in fact; it is simply not enforced.)
- **Suggested fix:** assert `extraNutrients` deep-equality between DB rows and fixture rows in `imports.e2e-spec.ts`, and add the F-01 spot-checks (published values for `070152`/`080001`/`010109`) as literal expectations.
- **Blocks Gate F: NO** (but the fix is trivial and should land with F-01).

### F-07 — LOW (accepted F2, still live) — CORS allowlist `startsWith` prefix check also defeats the exact-match entries

- **File:** `apps/api/src/config/env.ts:69-80` (`if (origin.startsWith(prefix)) return true;`).
- **Evidence (reproduced live):**
  ```
  $ curl.exe -s -i -X OPTIONS …/v1/foods -H "Origin: http://localhost.evil.com" -H "Access-Control-Request-Method: GET"
  HTTP/1.1 204 No Content
  Access-Control-Allow-Origin: http://localhost.evil.com        ← echoed
  $ curl.exe -s -i "…/v1/foods?limit=1" -H "Origin: http://localhost.evil.com"
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://localhost.evil.com        ← echoed
  $ curl.exe -s -i "…/v1/foods?limit=1" -H "Origin: http://localhost:5173.evil.com"
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://localhost:5173.evil.com   ← echoed
  ```
  The recorded F2 note describes this as a `http://localhost:*`-config lookalike issue. QA's evidence is broader: because `CORS_ORIGINS` contains `http://localhost:*` (prefix `http://localhost`), **any** origin beginning with `http://localhost` is allowed, so the lookalike also defeats the exact-match entries (`http://localhost:5173.evil.com` passes). No impact while the API is unauthenticated read-only.
- **Suggested fix (unchanged from the recorded remediation):** parse the origin and compare protocol + hostname exactly, allowing a port wildcard only; add an e2e case for `http://localhost.evil.com`.
- **Blocks Gate F: NO** — deferral to S3 is defensible, but it must be fixed before S3 auth makes this an exploitable boundary.

### F-08 — LOW — Prisma `contains` does not escape LIKE wildcards (`q=%` matches the whole catalog)

- **File:** `apps/api/src/foods/foods.prisma-repository.ts:43-49`.
- **Evidence:** `curl.exe -s "http://localhost:3000/v1/foods?q=%25"` → `total=18`; `?q=_` → `total=18`; baseline `?q=doro` → `total=2`. A `q` of `%` or `_` behaves as a wildcard rather than a literal, so the filter is silently bypassable. Bounded by `limit ≤ 100` and the catalog is public, so the impact is a semantic/abuse-hygiene issue, not data exposure. This matches the Gate D INFO note.
- **Suggested fix:** escape `%`, `_` and `\` in `q` before passing to `contains` (or use a raw `ILIKE` with an explicit `ESCAPE`), plus a test that `q='%'` returns 0 results.
- **Blocks Gate F: NO.**

### F-09 — LOW — `page` has no upper bound; deep offsets return 200 with empty data

- **File:** `apps/api/src/common/dto/pagination.dto.ts:5-10` (`@Min(1)` but no `@Max`).
- **Evidence:** `curl.exe -s "…/v1/foods?page=999999999"` → `HTTP 200 {"data":[],"meta":{"page":999999999,"limit":20,"total":18,"hasNextPage":false}}`; `?page=99999999999` → also `200`. No 500 (Postgres tolerates the large `OFFSET`), but `skip = (page-1)*limit` can exceed 2^31 and `Number.MAX_SAFE_INTEGER`, so the value is neither validated nor meaningful. Note `page=0` and `limit=0` are correctly rejected.
- **Suggested fix:** add `@Max(...)` consistent with the catalogue size, or clamp `skip` and short-circuit when `skip >= total`.
- **Blocks Gate F: NO.**

### F-10 — LOW — catalog `ETag` is unquoted (non-RFC) and `If-None-Match` is compared as an exact string; catalog payload is unbounded and will reach ~780 KB at full coverage

- **Files:** `apps/api/src/foods/foods.controller.ts:41` (`res.setHeader('ETag', result.version)`), `apps/api/src/foods/foods.service.ts:82` (`etag === entry.version`), `foods.prisma-repository.ts:72-78` (`findAllActive` has no `take`).
- **Evidence.** The catalog response header is `ETag: 6cd950b7…` with **no surrounding double quotes**, which is not a valid RFC 9110 entity-tag (unlike Express's own weak tags elsewhere, e.g. the 404 response carried `ETag: W/"86-…"`). Because the comparison is exact-string, a standards-compliant client that echoes the quoted form gets a full `200` instead of `304`:
  ```
  If-None-Match: 6cd950b7…        -> 304
  If-None-Match: "6cd950b7…"      -> 200
  If-None-Match: W/"6cd950b7…"    -> 200
  ```
  The S1 mobile client sends the raw value, so the gate works for the only current consumer. Separately, `findAllActive()` has no limit by design (the catalog is a full snapshot), and the 18-food payload is 19,470 bytes (~1,081 B/food), so importing the committed 722-row extract would produce a ~780 KB response fetched under a 10 s timeout on mobile.
- **Suggested fix:** emit a properly quoted `ETag` and compare per RFC (accept `W/` and quoted forms); consider gzip for `/v1/catalog` and/or a delta/chunked snapshot before the 722-row import.
- **Blocks Gate F: NO.**

### F-11 — LOW — `tr` (trace) is collapsed to `NULL` for mapped fields, losing "present but below the limit of quantification"

- **Files:** `apps/api/src/imports/canonicalizer.ts:148-149`, `README.md:100-103`.
- **Evidence.** Rice `010167` has `"sodiumMg":"tr"` in the fixture and `NULL` in the DB (verified: `SELECT per100gSodiumMg IS NULL … WHERE sourceFoodCode='010167'` → `t`). This is the documented transform and is applied consistently by both parity tests — but across the committed 722-row extract, **278 `tr` cells occur in 177 rows (24.5% of rows)**, and `tr` is *preserved* verbatim for `extraNutrients` fields (e.g. egg `niacinEquivMg: "tr"`) while being nulled for the mapped scalars. So "trace" and "not measured/blank" are indistinguishable in `fiberG`/`sodiumMg` but distinguishable elsewhere. For a slice whose thesis is data honesty, collapsing a published qualitative value into absence is a fidelity loss worth recording.
- **Suggested fix:** keep `tr` as a sentinel (or a parallel `traceFields` list) rather than `NULL`, or document the collapse explicitly in the API contract.
- **Blocks Gate F: NO.**

### F-12 — MINOR — `/v1/foods` search and `/v1/catalog` use different import scoping, so they can disagree

- **Files:** `foods.prisma-repository.ts:36-62` (search filters `status: 'Active'` only) vs `foods.service.ts:110-113` (catalog additionally filters `r.importId === lastImport.id`).
- **Evidence.** The catalog deliberately excludes Active foods belonging to an older `ImportRun`; search does not. With the current single-import state the two agree exactly (both 18), and supersession correctly flips stale codes to `Deprecated`, so the invariant holds today. If a food ever remains `Active` under a superseded import, search would return foods the catalog snapshot omits — a silent divergence on the same data. Latent, no reproduction available without mutating the dev DB (out of QA scope).
- **Suggested fix:** apply the same `importId = latestCommitted` scoping to search, or assert the invariant in the import service.

### F-13 — MINOR — 404 messages reflect caller-supplied input verbatim

- **File:** `apps/api/src/foods/foods.service.ts:58-62`.
- **Evidence:** `curl.exe -s 'http://localhost:3000/v1/foods/%3Cscript%3Ealert(1)%3C%2Fscript%3E'` → `{"error":{"code":"FOOD_NOT_FOUND","message":"Food '<script>alert(1)</script>' not found","requestId":"…"}}`. The value is JSON-encoded and served as `application/json` with `X-Content-Type-Options: nosniff`, so this is **not** XSS in the API itself; it is a reflected-input pattern that becomes a risk only if a client interpolates the message into HTML. Also note the `:id` path parameter has no length bound.
- **Suggested fix:** echo a truncated/escaped id, or omit the caller's value from the message.

### F-14 — MINOR — undeclared **S2** planning artifacts sitting in the S1 working tree, and a branch-name discrepancy in the architect's report

- **Files (both untracked, both out of S1 scope, neither mentioned anywhere in `STATE.md`):**
  - `docs/adr/0007-ai-pipeline-and-provider-seam.md` — 6,304 bytes, mtime 2026-09-17 22:35. Self-describes as `Status: Accepted`, `Deciders: @architect (S2 Gate A)`, and relates to `docs/plans/slice-s2-blueprint.md`.
  - `docs/plans/slice-s2-blueprint.md` — 19,425 bytes, mtime 2026-09-17 22:52.
  QA grepped `STATE.md`: **no reference to `0007` or `slice-s2`** exists. Both predate this Gate C run, so they are pre-existing (not created by the fix or by QA).
- **Evidence.** `git status --porcelain -uall` shows 107 expanded entries when QA started (40 collapsed, vs the "~39" expected); the collapsed count is now 45 = 40 + 3 paths added by the Q1 fix (`catalog_mapper_contract_test.dart`, `test/fixtures/catalog_response.json`, and the blueprint edit) + 1 QA report + `docs/adr/0007-*`. Separately, the architect's fix message referred to a branch `feat/nourish-mobile`; QA checked and **no such branch exists** — `git branch -vv` shows only `feat/nourish-mvp 7817a9e` and `master 1c16902`, and `git remote -v` is empty. No second branch was created (AGENTS.md §4 respected), but the report's branch name is inaccurate. QA also confirms HEAD is still `7817a9e` with nothing committed, per the commit policy.
- **Suggested fix:** decide explicitly at Gate F whether the two **S2** artifacts belong in the S1 atomic commit — on the evidence they do not (AGENTS.md §5 requires an atomic commit for the slice under verification, and §3 keeps phases distinct); park them outside the commit or commit them with the S2 work. Correct the branch name in the record.

### F-15 — MINOR — the CI `npm audit --audit-level=high` gate fails closed on transient registry errors

- **Files:** `.github/workflows/api-ci.yml:90-101` (`npm ci` then `npm audit --audit-level=high`).
- **Evidence.** QA's first audit invocation **exited 1** with `npm warn audit request to https://registry.npmjs.org/-/npm/v1/security/advisories/bulk failed, reason: socket hang up` / `npm error audit endpoint returned an error` — a network failure, not a vulnerability. The immediate retry returned `found 0 vulnerabilities` (exit 0) and the JSON report confirmed `"vulnerabilities":{}` with info/low/moderate/high/critical all `0` over 783 dependencies. So the expected "0 vulnerabilities" result **is** reproduced, but the gate is flaky-fail rather than fail-safe.
- **Suggested fix:** retry the audit once on network error (or run `npm audit --json` and distinguish a registry error from findings) so CI does not red on a registry blip.
- **Blocks Gate F: NO.**

### F-16 — MINOR (process) — the Gate A-approved blueprint was amended mid-QA

- **File:** `docs/plans/slice-s1-blueprint.md` (working-tree modification, mtime 2026-09-19 01:04, `1 file changed, 11 insertions(+), 3 deletions(-)`).
- **Evidence.** QA read the full diff. It amends only §11 "Id stability", rewrites the rule to make the server's canonical `id` authoritative, retains the original as the fallback, and explicitly labels itself `AMENDED at Gate C — QA finding Q1`, citing `18/18 ids diverge` and the new contract test. QA verified the diff touches **no** acceptance criterion A1–A22, **no** §8 API contract row, **no** §15 test matrix row and **no** §16 rollback content — so this is an honest, attributable amendment and it does **not** invalidate the matrix in §2 of this report. Recorded because a Gate-A-approved artifact changed during the gate that validates it, which the Gate E/F record should acknowledge.

**Severity tally: BLOCKER 2 · MAJOR 1 (fixed & re-verified) · MEDIUM 3 · LOW 5 · MINOR 5 = 16 findings.**

---

## 6. Deviation adjudications

### Declared API deviations (9)

| # | Declared deviation | Verdict | Reasoning / evidence |
|---|---|---|---|
| 1-3 | CVE pins: `overrides` for `multer ^2.4.0`, `qs ^6.16.0`, plus `@types/pg` devDependency | **ACCEPTABLE** | QA reproduced resolution: `npm ls multer qs` → `multer@2.4.0`, `qs@6.16.0` (deduped under `body-parser@2.3.0`, `express@5.2.1`, `superagent@10.3.0`); `npm ls @types/pg` → `@types/pg@8.23.1`. `overrides` is present in `package.json`; `package-lock.json` is committed, so `npm ci` in CI resolves identically. `npm audit --audit-level=high` → `found 0 vulnerabilities` (0 high/critical). Gate passes in CI subject to F-15 |
| 4 | `FoodCategory` back-relation added on the `Food` model | **ACCEPTABLE** | Prisma requires the opposite relation field for `Food.category` to be a valid relation; the schema is exactly the blueprint's §9 model set (5 models). `npx prisma validate` → valid. No user-facing surface added |
| 5 | Throttler v6 requires manual `APP_GUARD` registration (no auto-registration as in v4) | **ACCEPTABLE — verified working** | `app.module.ts:34` registers `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. Behaviour confirmed empirically: the 61st request in a burst returned 429 with the `RATE_LIMITED` envelope and `Retry-After: 60`; `/v1/healthz` stayed 200 while throttled (exempt as specified). QA also confirmed the tracker is **not** bypassable via `X-Forwarded-For` (75 requests with a unique `X-Forwarded-For` each still produced 429s after ~60, so `req.ip` is used and `trust proxy` is not set) |
| 6 | `carbsG` = the published `CHOAVLDF` column | **ACCEPTABLE — verified correct** | `README.md:104-105` documents it. QA compared the published proximate block against the extract for all 18 foods: `CHO, available` matched exactly in 18/18 (e.g. `070152 … 5.1`, `010109 … 29.1`). Fibre is separately the published `FIBTG` and also matched 18/18. This is the correct tag mapping, not an approximation |
| 7 | `tsx` CLI wiring (`import:fct:*` scripts) | **ACCEPTABLE** | `package.json` exposes `import:fct:acquire\|fixture\|file\|status` via `tsx src/cli/import-fct.ts`, plus `extract:fct`, `verify:extract`, `db:seed`. The pipeline is CLI-only as required (no HTTP mutation route exists — all 5 routes are GET). `src/cli/import-fct.ts` present per §6 |
| 8 | Portion standards follow the blueprint's `nourish-standard` provenance rather than FCT-derived gram weights | **ACCEPTABLE** | Live evidence: every `portions[]` entry carries `"portionSource":"nourish-standard"`, and `defaultPortion` is returned separately. This is architect decision D3 and protects the "never present gram weights as FCT data" rule. QA notes these gram weights are correctly *not* attributed to the FCT |
| 9 | Extra files beyond §6: `src/app.setup.ts`, `src/prisma/prisma.module.ts`, `src/prisma/prisma.service.ts`, `test/db-utils.ts` | **ACCEPTABLE** | `app.setup.ts` factors the middleware stack so `main.ts` and the e2e suites run the **same** production stack (helmet, CORS allowlist, ValidationPipe, envelope filter, request-id, `/v1` prefix) — a genuine test-fidelity improvement, not scope creep. `prisma` module/service and `db-utils.ts` (test provisioning/truncation) are ordinary infrastructure. All are within `apps/api`, none widens the public surface |

### Declared mobile deviations (2)

| # | Declared deviation | Verdict | Reasoning / evidence |
|---|---|---|---|
| 10 | Test-contract fix: `PortionUnit.handful` → `PortionUnit.serving` in fixtures/tests | **ACCEPTABLE** | Forced by the locked domain enum (`handful` does not exist in `PortionUnit`). The production mapper *skips* unknown units with a log and never crashes (`api_catalog_data_source.dart:244-251`) — QA read this and confirms `_unitByName` returns `null` → `_portion` returns `null` → the portion is dropped, and `mapCatalogSnapshot` only fails outright if **no** food is usable. The test was corrected to match the locked contract rather than the contract being widened for a test |
| 11 | `honest_void_screen.dart` wrapped in `LayoutBuilder → SingleChildScrollView → ConstrainedBox(minHeight) → IntrinsicHeight → Center` | **ACCEPTABLE** | Fixes a real 44 px `RenderFlex` overflow at 320×480 that the M7 test exposed; no behavioural change on taller viewports. `flutter analyze` clean and `welcome_scroll_test.dart` (320×480, both buttons reachable) is green |

### Undeclared items found by QA (not in either declared list)

1. **`apps/api/src/app.setup.ts` shared-middleware decision is load-bearing but undeclared in its consequences** — it is listed as an "extra", yet it is what makes the e2e suites trustworthy (they exercise the real helmet/CORS/validation/envelope stack). Recommend it be recorded as a deliberate design decision rather than an incidental extra. **ACCEPTABLE.**
2. **`test/fixtures/catalog_response.json` + `catalog_mapper_contract_test.dart`** (added during this Gate C by the architect as the F-03 fix) — a *new committed fixture derived from the live API*. **ACCEPTABLE and good practice**, but note the fixture is a snapshot: it will silently age if the catalog changes, and it should be regenerated deliberately (documented command) rather than hand-edited.
3. **`docs/plans/slice-s2-blueprint.md`** — untracked, out of S1 scope, unmentioned in `STATE.md` (see F-14). **NEEDS-CHANGE (record-keeping only).**
4. **Branch-name inaccuracy** in the architect's fix report (`feat/nourish-mobile` does not exist; the work is on `feat/nourish-mvp`). **NEEDS-CHANGE (record-keeping only) — no second branch was actually created.**
5. **`apps/api/.dockerignore` and `.github/workflows/api-ci.yml`** — present and correct (F1/F3 closure); `.dockerignore` excludes `.env`, `.env.*`, `node_modules`, `dist`, `fct-downloads/`, `test/`; CI runs `npm ci`, `prisma generate/validate`, build, tests, and the audit gate. **ACCEPTABLE.**
6. **`docs/plans/slice-s1-blueprint.md` amended during Gate C** (F-16). **ACCEPTABLE — transparent and attributable; touches no acceptance criterion.**

---

## 7. Data-fidelity question — outcome

**VERIFIED — the extract deviates from the published table.** This is no longer an open question and it is not a fixture-parity issue: parity holds perfectly, and the **extract itself is wrong**.

- **Source retrieved:** the FAO Knowledge Repository bitstream for the *same* PDF cited in `prisma/fixtures/README.md` — `https://openknowledge.fao.org/server/api/core/bitstreams/3389ccb5-03e0-437e-8800-8d22db3ff585/content` (the "FAO-published text layer" the README itself names as the double-entry source), HTTP 200, 684,206 bytes. Publication: *Ethiopian Food Composition Table (2025) — User Guide and Condensed Table*, EPHI & FAO, ISBN 978-99990-0-953-9.
- **Page/section:** the Condensed Food Composition Table, block **2/5** (header `Code | Food name in English | Calcium | Iron | Magnesium | Phosphorus | Potassium | Sodium | Zinc | Copper | Manganese | Selenium`, `INFOODS Tagnames CA FE MG P K NA ZN CU MN SE`). `070152` appears on the page the README cites (223) and `080001` on page 243.
- **Answer for the two flagged foods:**
  - `doro_wot` (`070152`): the published mineral row is `24 1.2 16 85 167 332 0.62 0.09 0.25 6`. `sodiumMg: 0.62` is **wrong** — the published sodium is **332**; `0.62` is the published **zinc**. `ironMg: 16` is **wrong** — the published iron is **1.2**; `16` is the published **magnesium**.
  - `egg` (`080001`): the published mineral row is `38 1.8 11 138 108 137 0.97 0.05 0.02 28`. `ironMg: 138` is **wrong** — the published iron is **1.8**; `138` is the published **phosphorus**. `sodiumMg: 0.97` is **wrong** — the published sodium is **137**; `0.97` is the published **zinc**. `phytateMg: 292` is **wrong** — the published phytate is **0**; `292` is the published **cholesterol** (and `cholesterolMg: 2.02` is the published saturated fat).
- **Mechanism:** a systematic positional misalignment — the published Calcium value is dropped and each subsequent nutrient is shifted onto the preceding nutrient's key; the emitted value list is always a contiguous run of the published row starting at `Fe` or `Mg`. **18/18** imported foods are affected (offsets +1…+3). Macros are unaffected (**18/18** exact matches).
- **Why the repository believed otherwise:** `scripts/verify-extract.mjs` compares only code, **kcal** and name words (F-02), so its "double-entry verified" output is true only for energy.
- **Not verified / still unknown:** QA could not determine whether the misalignment also affects the vitamin blocks (3/5 and 4/5) or the remaining ~704 extract rows, because the published text layer is large and the automated comparison is reliable only where the printed SD/Min-Max rows do not interleave. **Those columns and rows should be treated as suspect until re-extraction.** QA did **not** guess at any value it could not read.

---

## 8. Limitations

1. **Vitamin blocks (3/5, 4/5) and the remaining 704 extract rows were not individually verified.** QA verified the mineral block (18/18 foods) and the phytate/cholesterol block (16/18 flagged, 2 aligned, with `egg` hand-verified against the published row) against the FAOpublished text layer. The vitamin columns were not compared; no conclusion is drawn about them.
2. **The published PDF itself was not downloaded and parsed.** Verification used FAO's own published text layer of the same PDF (the source the repository names). A byte-level PDF re-extraction was out of scope for a read-only QA pass and is the natural next step for the fix.
3. **`graphify` is not installed** on this machine, so `graphify update .` (AGENTS.md §9) could not be run. Recorded as a limitation, not pretended.
4. **The dev `nourish` DB was not mutated**, so F-12 (search vs catalog import scoping) and F-05 (partial-snapshot replacement) are reasoned from code and from the current state, not reproduced by inducing the divergent state. Both are marked with their confidence explicitly.
5. **The mobile cache-replacement path was exercised only through the existing Drift-backed tests**, not on a device or emulator; no Flutter integration/emulator run was performed.
6. **Verification ran on Windows/pwsh with Node v24.16.0 and Flutter 3.44.8 (stable).** CI (ubuntu, Node 24) was not executed; CI-specific behaviour is inferred from the workflow file.
7. **`npm audit`'s first invocation failed on a registry socket error** and reproduced only on retry — reported honestly as F-15; the "0 vulnerabilities" criterion is marked PASS on the reproduced retry.
8. **One mid-run fix (F-03) and one mid-run blueprint amendment (F-16) occurred after parts of the matrix were first evaluated.** Every affected result above states pre-fix vs post-fix explicitly; all post-fix results were re-run by QA against the live API and the working tree.
9. **No security sign-off is given by this report.** Gate D's security pass stands on its own evidence; QA's CORS/throttler/redaction checks here are functional verifications, not a re-run of Gate D.

---

## 9. What must block the commit (Gate F)

1. **F-01 (BLOCKER)** — re-derive `fct-2025-extract.jsonl` and `fct-2025-fixture-subset.jsonl` with correct mineral/phytate column alignment, re-import, and re-verify. Do not commit wrong nutrition data.
2. **F-02 (BLOCKER)** — correct the verification claim: either extend `verify-extract.mjs` to compare nutrient columns and re-run it, or remove the "double-entry verified" assertion from `prisma/fixtures/README.md` so the repository makes no claim it cannot support.
3. **F-06** — add the `extraNutrients` parity assertion and the `070152`/`080001`/`010109` published-value spot-checks so this class of defect cannot return silently. (Cheap; should land with F-01.)
4. **F-14 / F-16** — keep the two undeclared **S2** artifacts (`docs/adr/0007-ai-pipeline-and-provider-seam.md`, `docs/plans/slice-s2-blueprint.md`) out of the S1 atomic commit, correct the branch name (`feat/nourish-mobile` does not exist) in the record, and acknowledge the §11 blueprint amendment in the Gate E/F record.

Nothing else found blocks Gate F. F-03 is fixed and independently re-verified. F-04, F-05, F-07–F-13, F-15 are recorded for tracking (F-07 remains an S3-deferred security item per the architect's recorded decision, with QA's confirmation that it is broader than a `http://localhost:*`-config lookalike and must be fixed before S3 auth).
