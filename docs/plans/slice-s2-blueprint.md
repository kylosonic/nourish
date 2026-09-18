# Slice S2 Blueprint — Photo Scan AI Loop (+ text logging)

- **Status:** PLANNED (approved by @architect; decisions D-S2-1..D-S2-9 below)
- **Branch:** `feat/nourish-mvp`
- **Slice:** S2 per ADR-0002 and `docs/plans/execution-contract.md`
- **Predecessor:** S1 (backend + canonical food API) — see `docs/swarm/STATE.md`
- **Behaviors:** SCAN-01..07, LOG-01, SAFE-05/06/07
- **Design sources (Stitch):** `Design/scan_menu`, `Design/camera_screen`,
  `Design/ai_analysis_screen`, `Design/ai_result_screen`,
  `Design/low_confidence_state`
- **Absent designs (tracked, not silently invented):** P-SCAN-1 (Edit Meal),
  P-LOG-1 (text logging screen), P-SCAN-2 (confidence thresholds),
  P-SCAN-3 (ADJUST vs EDIT). Resolutions proposed here as **PPA-9..PPA-12**
  (see §11) and they require human sign-off at UAT.

## 1. Goal

Ship the signature product loop end-to-end:

`Scan menu → Camera/Gallery → AI analysis → Ethiopian food retrieval →
portion estimate → deterministic nutrition → confirmation → meal saved →
Home updated`

plus text meal logging (LOG-01) through the same pipeline. The AI proposes;
**the deterministic engines decide**. Malformed AI output is rejected, never
displayed. When no AI provider is configured the API says so honestly (503) and
never fabricates a result.

## 2. Scope / non-scope

**In scope**

- API: AI provider seam; analysis pipeline (quality → vision/text →
  candidate retrieval → canonical normalization → portion → nutrition →
  confidence); `POST /v1/analyses`, `GET /v1/analyses/:id`,
  `POST /v1/analyses/:id/corrections`; anonymous analysis-run persistence
  (no user identity); retention/purge CLI; rate limits + daily budget guard;
  strict image validation; runtime schema validation of AI output.
- API (**carried in from S1 Gate C, QA finding F-04**): retrieval precision.
  The S1 transliterator emits **ingredient** words as Geez aliases, so 8 of 70
  aliases collide across foods (`ጨው` "salt" is an alias of 11 foods;
  `?q=እንቁላል` "egg" returns `doro_wot` before `egg`). S2's vision→retrieval
  stage searches through that endpoint, so it is fixed here: (a) stop-word
  ingredient aliases (salt, oil, water, onion, butter, spices…) are no longer
  generated, and (b) results rank by match kind — exact canonical-name match
  first, then curated `alternate` aliases, then `appTransliteration`, with a
  deterministic tiebreak. Acceptance: `?q=እንቁላል` ranks `egg` first; `?q=ጨው`
  no longer returns 11 foods; S1's A6 stays green.
- Mobile: camera capture screen, gallery pick, analysis progress screen,
  AI result screen, low-confidence resolution screen, edit-before-save
  sheet, text logging screen; client-side image downscale + metadata strip;
  scan-menu rewiring; meal save with nutrition snapshot; corrections
  reporting (best-effort).
- Tests: unit (pipeline stages, validators, confidence, portion conversion),
  e2e (endpoint contract, error envelopes, rate limit, budget, retention),
  mobile widget/unit tests for every new screen + the mapper.

**Out of scope (explicitly deferred, honest voids stay)**

- Voice logging (LOG-02) — needs a speech plugin + undesigned screen
  (P-LOG-1/2 family). `USE VOICE` stays an honest void.
- Barcode (LOG-03) and label OCR (LOG-04) — undesigned (P-LOG-2/3).
  `SCAN BARCODE` stays an honest void.
- Custom foods (P-LOG-4), food details/portion-edit screens, saved meals,
  recipes, admin review UI (SAFE-07 admin app is beyond MVP except the
  capture side, which IS in scope).
- Auth, server-side user meals, queued offline sync (S3).
- Payments/subscriptions (S3/S4).

## 3. Acceptance criteria

| # | Criterion | Verification |
|---|---|---|
| B1 | No AI provider configured → `POST /v1/analyses` returns 503 `AI_UNAVAILABLE`, never a fabricated result | e2e analysis spec (provider env unset) |
| B2 | Fixture provider is refused when `NODE_ENV=production` even if `AI_PROVIDER=fixture` | unit spec on provider factory |
| B3 | Photo analysis returns a schema-valid result: items with `foodId`, `portion.grams`, `per100g`, `nutrition`, per-item `confidence`, `overallConfidence`, `confidenceState` | e2e analysis spec (fixture provider) |
| B4 | Malformed AI output is rejected: pipeline fails the run with 502 `AI_INVALID_OUTPUT`; nothing is shown/persisted as a result | unit spec feeding malformed provider payloads + e2e |
| B5 | Nutrition is deterministic: `nutrition = per100g × grams / 100`, half-away-from-zero rounding, computed from DB values only (AI never supplies nutrition) | unit spec with known vectors + e2e parity |
| B6 | Unresolvable candidate → item marked `unresolved: true`, `foodId: null`, `nutrition: null` — never an invented food or value | unit + e2e spec |
| B7 | Ethiopian alias resolution: an AI candidate "doro wet" resolves to canonical `doro_wot`; Amharic "ዶሮ ወጥ" also resolves | e2e analysis spec |
| B8 | Low overall confidence (< 0.50) returns `confidenceState: "Low"` plus ranked `candidates[]` for the low-confidence screen | e2e spec (fixture run with low scores) |
| B9 | Image validation: > `AI_MAX_IMAGE_BYTES` → 413; unsupported mime → 415; byte-identical non-image → 422; text input > 500 chars → 400 | e2e spec |
| B10 | Analyses are rate limited separately from the read API (`AI_RATE_LIMIT_LIMIT`/min/IP → 429) and the daily budget guard (`AI_DAILY_BUDGET`) returns 429 `AI_BUDGET_EXHAUSTED` | e2e spec |
| B11 | Uploaded imagery is never persisted by the API (no file write, no DB column) — SAFE-05 retention is structurally satisfied; run metadata only | e2e + code inspection + grep gate |
| B12 | Corrections are captured without personal identity: prediction, choice, portion, model/prompt version, timestamp — no user id, no image; capture failure never blocks a save | e2e spec + mobile test |
| B13 | Purge CLI deletes analysis runs older than `ANALYSIS_RETENTION_DAYS` | e2e/CLI spec |
| B14 | Mobile: scan menu routes TAKE PHOTO → camera, CHOOSE PHOTO → analysis, DESCRIBE MEAL → text log; USE VOICE and SCAN BARCODE still open honest voids | widget test |
| B15 | Mobile: image preparation downscales to ≤ 1280 px longest edge and re-encodes JPEG, dropping EXIF/GPS metadata | unit test on a fixture image with GPS EXIF |
| B16 | Mobile: analysis progress screen runs the three real stages in order and never claims a stage that did not run; failure → retry/cancel with no meal data | widget test |
| B17 | Mobile: result screen shows total kcal + macros + per-item `~ kcal`, `CONFIRM MEAL` saves a meal with its nutrition snapshot and returns to origin with Home updated | widget test (end-to-end within app) |
| B18 | Mobile: EDIT/ADJUST opens the edit sheet (amount/unit, remove, add-via-search, live total); edits recompute deterministically without re-invoking AI | widget test |
| B19 | Mobile: low-confidence screen shows candidates + always-reachable "none of these" → food search, and the choice flows into confirmation | widget test |
| B20 | Mobile: no new network egress outside `lib/data/sources/` + `lib/data/sync/` | grep gate |
| B21 | Regression: all S0/S1 suites stay green (mobile 107+, domain 27, design-system 13, api unit 19+, api e2e 31+) and all analyzers clean | full suite run |
| B22 | No `TODO`/`STUB`/`PLACEHOLDER` in shipped source; no raw SQL; no secrets committed | grep gates |

## 4. Architect decisions (LOCKED)

**(D-S2-1) AI provider seam.** `VisionProvider`/`TextProvider` are interfaces.
Implementations: `OpenAiCompatibleProvider` (real HTTP: `AI_BASE_URL`,
`AI_API_KEY`, `AI_VISION_MODEL`, `AI_TEXT_MODEL`), `NullProvider` (no key →
503), `FixtureProvider` (deterministic, test/dev only). The factory **throws if
`AI_PROVIDER=fixture` and `NODE_ENV=production`**. No other provider returns
canned data. This satisfies master §61 (no fake API responses in production)
and master §71.

**(D-S2-2) The AI never computes nutrition or targets.** The pipeline takes
only candidate names/portions/confidence from the AI. Retrieval, portion
conversion and nutrition come from the S1 food layer + deterministic math.

**(D-S2-3) Runtime schema validation at the AI boundary.** AI payloads are
validated with the project's existing validation stack (class-validator +
class-transformer, whitelist + forbidNonWhitelisted). Any violation → the run
is failed with `AI_INVALID_OUTPUT`; no partial result is surfaced.

**(D-S2-4) No image persistence in S2.** Uploaded bytes are held in memory for
the request only; nothing is written to disk or stored in the database. SAFE-05
is satisfied structurally (retention: none). Metadata stripping is enforced
client-side (B15) and the server additionally re-encodes nothing — it never
trusts client metadata. R2/meal imagery is S3+/S5.

**(D-S2-5) Anonymous by construction.** S2 adds analysis tables with **no user
identity**; a nullable `userId` column is reserved for S3 linking and stays
null in S2.

**(D-S2-6) Corrections (SAFE-07) without identity.** Only structural learning
data is stored: predicted label, chosen label/portion, model version, prompt
version, timestamp. No user id, no image, no free text. This is quality
analytics, not model training (SAFE-06 default-off is respected: no imagery and
no identity ever enter the record).

**(D-S2-7) Cost/abuse controls.** Analyses have their own throttler bucket
(`AI_RATE_LIMIT_LIMIT`, default 10/min/IP) plus a process-wide daily budget
(`AI_DAILY_BUDGET`, default 2000) that returns 429 `AI_BUDGET_EXHAUSTED`.
Timeouts: `AI_TIMEOUT_MS` default 20000.

**(D-S2-8) Mobile image preparation is pure Dart.** `package:image` performs
bake-orientation → downscale (≤1280 px) → JPEG re-encode (quality 80), which
drops EXIF (incl. GPS). No native plugin is needed for this step; the camera
and gallery plugins are abstracted behind an `ImageAcquisitionService` seam so
widget tests never touch platform channels.

**(D-S2-9) Confidence (P-SCAN-2 proposal, provisional).**
`itemConfidence = aiConfidence × matchFactor` with
`exact = 1.0, alias = 0.95, fuzzy = 0.80, none = 0.30`;
`overallConfidence = round(0.5·min + 0.5·mean, 2)` over resolved items (an
unresolved item forces `Low`).
States: `High ≥ 0.80`, `Medium ≥ 0.50`, `Low < 0.50`. Thresholds are
configuration values (`CONFIDENCE_HIGH_MIN`, `CONFIDENCE_LOW_MAX`), so product
can retune without code change.

## 5. API contract additions (v1)

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/v1/analyses` | `multipart/form-data` `image` (≤ `AI_MAX_IMAGE_BYTES`, default 4 MiB; jpeg/png/webp) **or** `application/json` `{text: 1..500}` | 201 `AnalysisResult` |
| GET | `/v1/analyses/:id` | — | 200 `AnalysisResult` (stored run, no imagery) / 404 envelope |
| POST | `/v1/analyses/:id/corrections` | `{items:[{itemId, action:"swap"\|"portion"\|"remove"\|"add", to:{foodId?,amount?,unit?}}]}` | 204; best-effort, never blocks the client |

`AnalysisResult`:

```json
{
  "id": "an_…", "status": "completed", "inputKind": "photo|text",
  "confidenceState": "High|Medium|Low", "overallConfidence": 0.87,
  "items": [{
    "id": "it_…", "displayName": "Doro Wot", "foodId": "doro_wot",
    "sourceFoodCode": "070152", "canonicalName": "Chicken, meat, …",
    "matchedName": "Doro wot", "matchKind": "exact|alias|fuzzy|none",
    "portion": {"amount": 1, "unit": "cup", "grams": 240, "estimated": false,
                "portionSource": "nourish-standard"},
    "per100g": {"kcal": 219, "proteinG": 6.8, "carbsG": 5.1, "fatG": 18.4,
                "fiberG": 2.9, "sodiumMg": 0.62},
    "nutrition": {"kcal": 526, "proteinG": 16.3, "carbsG": 12.2, "fatG": 44.2,
                  "fiberG": 7, "sodiumMg": 1.49},
    "confidence": 0.91, "unresolved": false
  }],
  "totals": {"kcal": 0, "proteinG": 0, "carbsG": 0, "fatG": 0,
             "fiberG": 0, "sodiumMg": 0},
  "candidates": [{"displayName": "Shiro Wot", "foodId": "shiro_wot",
                  "confidence": 0.42}],
  "modelVersion": "…", "promptVersion": "scan-v1", "notes": []
}
```

Error codes added: `AI_UNAVAILABLE` (503), `AI_INVALID_OUTPUT` (502),
`AI_TIMEOUT` (504), `IMAGE_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415),
`IMAGE_UNREADABLE` (422), `NO_FOOD_DETECTED` (422), `AI_BUDGET_EXHAUSTED`
(429), `ANALYSIS_NOT_FOUND` (404). All keep the S1 envelope
`{error:{code,message,requestId}}`.

**Id-namespace bridge (integration requirement, architect).** The S1 API
exposes slug ids (`doro_wot`) while the mobile local catalog keys FCT foods as
`fct-<sourceFoodCode>` (blueprint S1 §11 id-stability rule, unless the canonical
name matches an S0 seed food). Every analysis item therefore carries
`sourceFoodCode` and `canonicalName` in addition to the API `foodId`, and the
mobile mapper resolves an item to its **local** catalog id by:
(1) exact `fct-<sourceFoodCode>` hit, else (2) seed-slug match on
`canonicalName`, else (3) unresolved (`foodId: null` locally, item flagged and
not saveable until the user resolves or removes it — B6). The mobile app never
assumes the server's id namespace is its own.


## 6. File tree deltas

### `apps/api/` (new)

```
prisma/schema.prisma                     +AnalysisRun, +AnalysisItem, +AnalysisCandidate, +AnalysisCorrection (NO user tables)
prisma/migrations/<ts>_analysis_layer/   additive migration
src/ai/ai.module.ts
src/ai/ai-provider.ts                    VisionProvider/TextProvider interfaces + tokens
src/ai/openai-compatible.provider.ts     real HTTP provider (timeout, retry-once on 5xx)
src/ai/null.provider.ts                  503 provider
src/ai/fixture.provider.ts               deterministic test/dev provider (production-guarded)
src/ai/ai-provider.factory.ts            env-driven selection + production guard
src/ai/prompt.ts                         versioned prompt constants (promptVersion)
src/ai/ai-response.validator.ts          class-validator schema for AI JSON
src/ai/dto/ai-response.dto.ts
src/analysis/analysis.module.ts
src/analysis/analysis.controller.ts      POST /v1/analyses, GET :id, POST :id/corrections
src/analysis/analysis.service.ts         orchestration + persistence
src/analysis/pipeline/*.ts               image-quality, retrieval, normalization, portion, nutrition, confidence stages
src/analysis/analysis.repository.ts      run/item/candidate/correction CRUD
src/analysis/dto/*.ts                    request/response DTOs
src/analysis/image-input.ts              mime/size/dimension validation (in-memory, never persisted)
src/analysis/retention.ts                purge-old-runs helper
src/cli/purge-analyses.ts                CLI: analysis:purge
src/config/env.ts                        +AI_* vars
test/analysis.e2e-spec.ts, test/ai-validator.spec.ts, test/pipeline.spec.ts,
test/confidence.spec.ts, test/portion-stage.spec.ts, test/retention.spec.ts
```

### `apps/mobile/` (new + modified)

```
lib/data/sources/analysis_api_client.dart      (NEW) POST /v1/analyses, corrections; timeout; error mapping
lib/data/models/analysis_result.dart           (NEW) DTO + mapper (unknown unit guard)
lib/data/services/image_acquisition_service.dart (NEW) seam: camera | gallery | fake
lib/data/services/image_preparation.dart       (NEW) downscale + JPEG re-encode (EXIF strip)
lib/features/scan/camera_screen.dart           (NEW) SCAN-02
lib/features/scan/analysis_progress_screen.dart (NEW) SCAN-04
lib/features/scan/analysis_result_screen.dart  (NEW) SCAN-05
lib/features/scan/low_confidence_screen.dart   (NEW) SCAN-06
lib/features/scan/meal_edit_sheet.dart         (NEW) SCAN-07 (provisional design — PPA-10)
lib/features/scan/text_log_screen.dart         (NEW) LOG-01 (provisional design — PPA-11)
lib/features/scan/scan_menu_sheet.dart         (MOD) rewire 3 lanes; keep 2 honest voids
lib/features/scan/analysis_controller.dart     (NEW) flow state (idle/running/result/lowConfidence/failed)
lib/router/routes.dart, app_router.dart        (MOD) +camera, +analysis, +text-log routes (transactional shell suppression)
lib/providers.dart                             (MOD) +analysis providers
lib/l10n/strings.dart                          (MOD) +scan/analysis copy
lib/data/repositories/meal_repository.dart     (MOD) save-from-analysis path (snapshot preserved)
test/analysis_mapper_test.dart, test/image_preparation_test.dart,
test/widget/camera_screen_test.dart, test/widget/analysis_flow_test.dart,
test/widget/low_confidence_test.dart, test/widget/meal_edit_sheet_test.dart,
test/widget/text_log_test.dart, test/widget/scan_menu_routing_test.dart
```

### Docs

```
docs/plans/slice-s2-blueprint.md      — this file
docs/adr/0007-ai-pipeline-and-provider-seam.md — (NEW) records D-S2-1..D-S2-9
docs/swarm/STATE.md                   — gate updates
```

## 7. Security (Gate D re-opens)

- New public surface: `POST /v1/analyses` (anonymous, cost-bearing). Controls:
  rate limit, daily budget, size/mime/dimension caps, provider timeout,
  20 s hard deadline, sanitized 5xx, no stack traces.
- No imagery persisted, no PII in analysis rows, corrections carry no identity.
- API key only from env (`AI_API_KEY`); never logged; redaction in the logger.
- Error envelopes must not echo provider response bodies.
- SSRF: `AI_BASE_URL` is operator-configured (env), never user-supplied.
- Grep gates: no `$queryRaw`; no secret literals; no `fs.writeFile` of request
  bytes.

## 8. Test matrix (behaviors → tests)

| Behavior | Test |
|---|---|
| SCAN-01 | `scan_menu_routing_test.dart` (B14) |
| SCAN-02 | `camera_screen_test.dart` (closed/permission/failure paths) |
| SCAN-03 | `image_preparation_test.dart` (B15) |
| SCAN-04 | `analysis_flow_test.dart` (B16) |
| SCAN-05 | `analysis_flow_test.dart` + `analysis.e2e-spec.ts` (B3, B17) |
| SCAN-06 | `low_confidence_test.dart` (B8, B19) |
| SCAN-07 | `meal_edit_sheet_test.dart` (B18) |
| LOG-01 | `text_log_test.dart` + e2e text lane |
| SAFE-05 | B11 (no persistence) |
| SAFE-06 | B12 (no identity/imagery in corrections) |
| SAFE-07 | corrections e2e + B12 |

## 9. Risks & mitigations

1. **No vision provider key in this environment.** Mitigation: provider seam +
   fixture provider for tests; the honest 503 path is itself an acceptance
   criterion (B1). The real provider code path is exercised by a mocked HTTP
   server in unit tests; live recognition quality is NOT claimable and will be
   stated as an open blocker, never implied.
2. **Camera/gallery plugins are native.** Mitigation: `ImageAcquisitionService`
   seam; widget tests use the fake; `flutter analyze`/`flutter test` must stay
   green without a device.
3. **Pure-Dart image processing may be slow on large photos.** Mitigation:
   downscale before full decode where possible (plugin-free path uses
   `decodeImage` on the picked bytes, then `copyResize`); a follow-up
   native-compression task is recorded for S3 if profiling shows > 1.5 s.
4. **Edit/text screens are undesigned (P-SCAN-1, P-LOG-1).** Mitigation:
   provisional designs built strictly from the design system + the behavior
   contracts' minimum contents, tracked as PPA-10/PPA-11 for human sign-off.
5. **Anonymous cost abuse.** Mitigation: D-S2-7 controls.
6. **Catalog payload growth (S1 QA F-10, tracked here).** `GET /v1/catalog`
   returns the whole catalog in one body: 18 foods now, but the full 722-row
   FCT set would be roughly 780 KB, fetched under a 10 s mobile timeout and
   then written in one Drift transaction. S2 sets `limit`-driven retrieval on
   the *search* endpoint rather than the snapshot, so the AI path is unaffected,
   but the snapshot path needs a plan before the full extract ships: enable
   response compression on the API, and/or move the mobile cache to an
   incremental/paged sync. Recorded as a tracked item; not silently ignored.

## 10. Definition of Done

All §3 criteria evidenced with commands; lint/build/analyze clean; all suites
green; `npm audit --audit-level=high` clean; greps clean; QA approved;
security approved; integration verified; one atomic commit; UAT handoff with
the coverage and provider limitations stated explicitly.

## 11. New provisional product assumptions (await human sign-off at UAT)

- **PPA-9** — confidence thresholds and the min/mean blend of D-S2-9.
- **PPA-10** — Edit-before-save built as a bottom sheet from design-system
  primitives (no Stitch screen exists; P-SCAN-1). ADJUST and EDIT open the
  same sheet (P-SCAN-3); ADJUST focuses the detected-items list.
- **PPA-11** — Text logging screen built per LOG-01's design language
  (entry + editable detected list + confirm) (P-LOG-1).
- **PPA-12** — Analyses are anonymous in S2; no user identity is stored until
  S3 links runs to accounts.
- **PPA-13** — Voice (LOG-02), barcode (LOG-03) and label OCR (LOG-04) remain
  honest voids in S2 (need designs P-LOG-2/3 and plugins).
