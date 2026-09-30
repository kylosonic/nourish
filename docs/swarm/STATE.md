# Swarm Orchestration State

Authoritative workflow state for the Nourish engineering swarm.
Maintained by `@scribe`. A gate is never marked complete without the invoking
agent's exact approval.

## Current State

| Field | Value |
| --- | --- |
| Phase | `IMPLEMENTING — S0–S5 all built and committed except the S3 apply/restore half; UAT pending` |
| Active branch | `feat/nourish-mvp` (clean tree; `master` still at the S0 release commit `1c16902`) |
| Batch | Nourish MVP vertical slices S0–S5 |
| Active slice | S3 — the device queues every local change, backs it up on request, and can now *read* the server's changes; writing them back into the local tables (apply/restore) is not built |
| Active gate | none in flight — each slice was verified against its own criteria and committed. **UAT has not been run**: `docs/uat-checklist.md` is ready and no check in it has been executed |
| Retry count | S1 Gate C: QA rejected once (F-01/F-02 BLOCKERs), both fixed and independently re-verified. No other gate retries. |
| Latest commit | `e1afc91` (chore — dead string cleanup) |

> **2026-09-19 session note (read this first).** The swarm agent dispatches
> (the `.opencode` orchestration) were stopped at the human's instruction
> part-way through this session; everything after that point was done directly,
> without agent hand-offs. S1 and S2 were each taken through implementation →
> tests → independent QA (S1 only) → security-relevant review → commit, and the
> evidence is in the blocks at the end of this file plus the commits themselves.
> Treat the commits and those evidence blocks as the state of record; the
> `INTAKE → … → DEPLOYED` state machine in AGENTS.md §3 is no longer being
> driven formally.

## Gates

### Completed

- **Intake** — master engineering prompt and Stitch design set received.
- **Discovery** — behavior contracts written in `docs/behaviors/`
  (README + behavior files + pending-behaviors).
- **Baseline** — commit `25e27c8`.
- **Gate A (blueprint)** — APPROVED by `@architect` with notes:
  (a) ADR-0003/0004/0005 already on disk (earlier "missing" caveat was a
  parallel-run artifact); (b) water target fixed at 3.0 L in S0 is accepted
  slice-limited deviation, adjustability deferred to S4; (c) go_router version
  resolved at `pub add` time; (d) target-engine test cases hand-verified by
  architect.
- **Gate B part 3 (UI)** — COMPLETE 2026-08-26. `@designer` delivered: full
  `packages/design-system` (tokens/theme/8 widget primitives, Inter
  400/600/700 + Noto Sans Ethiopic 400/700 bundled locally, 13 tests); all 16
  stub screens replaced with real Stitch-faithful implementations + missing
  widgets/controllers created (onboarding flow/controller, home screen +
  calorie ring/macro pills/meals/hydration widgets, scan menu sheet, search
  widgets, history widgets, honest voids); 37 new mobile tests. Architect
  independently verified: `flutter analyze` clean (apps/mobile +
  design-system), `flutter test` +87 (mobile), +13 (design-system), +27
  (domain untouched), zero-egress grep zero, STUB/TODO/PLACEHOLDER grep zero,
  5 fonts present (324–365 KB).
- **Gate C (QA)** — `QA APPROVED` 2026-08-26 (independent @qa). Full blueprint
  §16 matrix covered; suites reproduced by QA: +87 mobile, +13 design-system,
  +27 domain; analyzers clean. Extended zero-egress grep zero matches. 7
  MINOR findings, none blocking — recorded under Unresolved Risks as deferred
  polish. Designer deviations all adjudicated ACCEPTABLE/CORRECT (incl.
  `/welcome` redirect change — required by ONB-09; skip-pace null persistence
  — per ONB-06/engine §8).
- **Gate D (security)** — `SECURITY NOT REQUIRED` recorded for S0. Rationale:
  zero network egress (architect + QA double-verified), no secrets/tokens, no
  auth/permissions, no remote code/uploads, no external inputs. Residual:
  health data in app-private local SQLite unencrypted at rest — documented
  provisional risk (blueprint §14), deferred to S3. Re-open immediately if
  any runtime network call or secret appears.
- **Gate E (integration)** — PASS by architect 2026-08-26: both packages
  compile/analyze clean together; router contract intact (16
  const-constructed screens); provider graph acyclic with 22 uniquely-named
  providers; greenfield Drift schema v1 (no migrations); integrated paths
  covered (87 mobile tests incl. end-to-end widget flows); no unresolved
  TODO/stub in shipped paths (honest-void lanes intentional); branch contains
  only intentional changes (untracked apps/, packages/; STATE.md). `graphify`
  unavailable — limitation recorded (not run, not pretended).
- **Gate F (commit)** — COMPLETE: commit `80800d4` — `feat: S0 —
  foundation, onboarding, home, and manual logging (offline MVP)` on
  `feat/nourish-mvp`, atomic, 231 files, working tree clean after commit.
  Root `.gitignore` and both package `.gitignore`s updated to COMMIT
  `pubspec.lock` (blueprint §7 reproducible builds; 3 lock files included).
  Pre-commit hygiene: 0 forbidden artifacts staged (no
  build/.dart_tool/ephemeral/.idea/.env); ephemeral iOS env artifact
  confirmed gitignored.
- **UAT (S0)** — APPROVED by human, 2026-08-26 (explicit "i approve" after
  hands-on review offer; PPA-1..8 surfaced with the offer, incl. PPA-7
  slot-row question for `@vision` — human approval is recorded as covering
  the slice as built; PPA items remain tracked for product-level refinement).
- **Release (S0)** — `v0.1.0-s0` released by `@devops`: `master`
  fast-forwarded `25e27c8 → 1c16902` (ff-only, 240 files); annotated tag
  `v0.1.0-s0` → commit `1c16902`; both branch tips identical at `1c16902`;
  working tree clean; repo left on `feat/nourish-mvp`. Deployment: NONE this
  phase — no remotes configured; store release infra is S5 (no unsigned
  artifacts). Rollback path documented:
  `git checkout master && git reset --hard 25e27c8 && git tag -d v0.1.0-s0`.
- **Gate A (S1)** — APPROVED by @architect 2026-08-26. Blueprint
  `docs/plans/slice-s1-blueprint.md` (status PLANNED, 525 lines, A1–A22
  acceptance criteria); ADR-0006 accepted (D1/D3/D5 data authority). Architect
  decisions D1–D5 recorded in blueprint §Decisions requested — RESOLVED (D1
  conditional attribution; D2 no Redis queue code in S1; D3 nourish-standard
  portion provenance; D4 Sentry API-only DSN-gated; D5 fixture-subset fallback
  with open-blocker + coverage-statement conditions). Test-DB strategy
  amendment included (§15).
- **Gate B (S1)** — COMPLETE 2026-08-27. Track B (mobile):
  architect-verified `flutter analyze` `No issues found!` + `flutter test`
  `+107: All tests passed!`; 5-file finish-fix list + 2 ACCEPTABLE deviations
  already recorded in the 2026-08-27 Track B resume block. Track A (api):
  `@build` delivered 65 files (64 under `apps/api/` +
  `.github/workflows/api-ci.yml`); Docker daemon started (containers reused
  non-destructively from planning session); stale spike schema reset via
  blueprint §16 `prisma migrate reset` then `init_food_layer` migration
  generated. FCT 2025 acquisition SUCCESS — FAO openknowledge bitstream
  (handle `20.500.14283/cd9308en`), PDF sha256
  `66A1EBF351C09212F323E33019AE47CA60232D84344EB98CAF3A55C90936CF97`,
  license determinable CC BY 4.0 (FAO record metadata, stated factually),
  extraction 722/722 rows of the published condensed table (coverage stated
  "722 of 727" — 5 rows exist only in the Excel datasheet distribution;
  never presented as full catalog); 23 rows lack usable kcal (20 kJ-only +
  3 malformed) — documented in fixtures README; fixture subset 18/18
  double-entry verified with page citations; 18/20 S0 foods matched to FCT
  entries (avocado 050003 + banana 050005 excluded — kJ-only cells; remain
  seed-bootstrap, documented). Stack: NestJS ^11.2.3, Prisma pinned 6.12.0
  (deepmerge-ts CVE avoidance), pdfjs-dist ^6.2.108, @sentry/node ^10.71,
  throttler ^6.5.0 (manual APP_GUARD), helmet ^8.3, no Redis client (D2).
  Gates: lint/build/prisma-validate clean; `npm test` 19/19; `npm run
  test:e2e` 31/31 (against Docker Postgres, `nourish_test`
  auto-provisioned); `npm audit` 0 vulnerabilities. A1–A11 + A22 evidenced
  green; A12–A21 are Track B (verified above). 9 API deviations all accepted
  with rationale (see build report summary: CVE pins ×3, FoodCategory
  back-relation (Prisma-required), throttler v6 APP_GUARD, carbsG=CHOAVLDF
  documented, tsx CLI direct wiring, blueprint portion standards,
  app.setup.ts/prisma module/db-utils extras). Working tree uncommitted.
- **Gate D (security)** — SECURITY PASS 2026-08-27 (independent @security;
  full checklist evidence: 5 GET routes only / 0 mutation decorators, schema
  = 5 food-layer models only (A11), 0 raw-SQL/$queryRaw, DTO whitelist +
  global ValidationPipe + bounds empirically 400-tested, throttler 60/min/IP
  + healthz exempt + no XFF trust-proxy, CORS allowlist no-wildcard, helmet +
  100kb body limit + sanitized 5xx, requestId envelopes, .env gitignored
  verified, `npm audit` 0/0/0/0/0 with all 3 CVE pins confirmed installed,
  mobile egress = exactly ONE import
  (`lib/data/sources/api_catalog_data_source.dart:4`), search never touches
  network, base URL via String.fromEnvironment, import pipeline bounded +
  transactional + idempotent + CLI-only, fixtures README provenance complete,
  PDF not committed, CI has no secrets + audit gate). Findings: F1 MEDIUM, F2
  LOW, F3 LOW, F4 LOW — details under Unresolved Risks below. 31/31 e2e
  re-run green by security.
- **F1/F3 fixes (S1 Gate D follow-up)** — CLOSED 2026-08-31, architect-verified
  (evidence under Last Verification Evidence): compose loopback binds +
  `.dockerignore` in place; runtime containers now loopback-only under compose
  project `api`; 18 foods survived the volume migration. F1/F3 entries under
  Unresolved Risks updated to CLOSED. F2/F4 remain S3-deferred.
- **Gate C (QA)** — NOT RUN (see Active). 2026-08-27 dispatch cancelled during
  session save; 2026-08-31 re-dispatches: attempt 1 harness-failed ("Cannot
  connect to API" — subagent runtime), attempt 2 cancelled by session save.
  ZERO QA evidence exists. NOT gate retries (environment-level).

### Active

- **Gate C (QA)** — STILL NOT RUN (zero evidence). 2026-08-31: dispatch
  attempt 1 harness-failed ("Cannot connect to API" — subagent runtime
  connectivity); attempt 2 cancelled by user-initiated session save. Both
  environment-level; NOT gate retries. Re-dispatch on resume (attempt 3).
  F1/F3 are now CLOSED, so Gate C runs against the fixed state. Next: Gate E
  (architect) → Gate F → UAT.

### Failed

- **Gate B part 1, attempt 1** — `@build` task returned an empty result and
  created zero files (subagent execution failure). Recovered per protocol:
  retried with reduced, checkpointed scope; succeeded (27/27 domain tests).
- None other.

## Resume Instructions — SESSION SAVE 2026-08-31 (previous list fully consumed)

> Previous checklist (saved 2026-08-27) is fully consumed this session:
> F1/F3 are CLOSED (architect-verified); Gate C was re-dispatched twice but
> produced zero evidence (harness failure + session-save cancellation). The
> ordered list below is the new authoritative checklist.

1. **Environment sanity (T0):** `git status` — expect HEAD at the session-save
   checkpoint (chore commit of STATE.md, 2026-08-31) on `feat/nourish-mvp`,
   ~39 uncommitted S1 implementation paths (unchanged since 2026-08-27).
   `docker ps` — expect `nourish-postgres`/`nourish-redis` healthy,
   loopback-only binds. If the machine rebooted again: start Docker Desktop,
   poll `docker info` ≤180s, then **`docker compose up -d` from `apps/api`**
   (containers are now compose-project-`api` managed — do NOT use
   `docker start` anymore). Verify `docker exec nourish-postgres psql -U
   nourish -d nourish -tAc 'SELECT COUNT(*) FROM "Food";'` = 18.
2. **Re-dispatch Gate C (QA)** to `@qa` (top-level, read-only, no commits) —
   same brief as the 2026-08-31 dispatch: S1 blueprint matrix A1–A22,
   both-track verification (mobile analyze/+107, domain +27, design-system
   +13, api lint/build/validate/19 unit/31 e2e, npm audit 0), live smoke
   curls (healthz, doro wet EN+AM A6, categories, catalog 304, 404/400
   envelopes), `nourish` DB still 18 foods after e2e, data-honesty + D5(c)
   coverage checks, §6 file-tree conformance, deviation adjudications (9 API
   + 2 mobile), grep gates (A14 egress, raw-SQL, STUB/TODO, secrets),
   F1/F3 fixed-state check. If the subagent dispatch fails at the harness
   level, retry once; if it fails again, architect escalates per the
   Failure Escalation protocol (do NOT silently substitute architect
   self-verification for independent QA — record the limitation instead).
3. **Gate E (integration)** — architect: api↔mobile contract compatibility
   (catalog JSON ↔ mobile CatalogFood mapper), migrations compatible, no
   unresolved TODO/STUB, branch clean except intentional changes, graphify
   limitation re-recorded.
4. **Gate F** — atomic commit on `feat/nourish-mvp` (apps/api + CI + mobile
   + docs; package-lock.json + pubspec.lock committed).
5. **UAT** — architect handoff with D5(c) coverage statement: "722 of 727
   foods (condensed table); 23 rows without usable kcal excluded;
   avocado/banana remain bootstrap-only". Human approval required before
   merge/release.
6. S3-tracked: F2 (CORS), F4 (validator bounds), plus existing S3 deferred
   items.

**Environment quirks learned (permanent learning block — applies to all
future sessions):** nested subagent dispatches fail at depth 1; `@build`
charter allows task delegation ONLY to qa/security; `@plan` blocks file
writes (use @scribe to materialize plan artifacts); top-level architect
dispatches to designer/qa/scribe/devops/plan/build work; **subagent dispatch
is UNRELIABLE in this environment — 2026-08-31: @fixer failed ("Failed to
execute statement"), @qa failed twice (harness connectivity, then
session-save cancellation), @build succeeded; keep briefs self-contained,
dispatch sequentially, and the architect must personally verify on-disk
end-state after any agent reports completion; session saves cancel in-flight
subagent tasks; for time-critical saves the architect may write STATE.md
directly (scribe dispatch adds failure risk).**

## Unresolved Risks

### Provisional product assumptions (awaiting human sign-off)

Tracked in `docs/plans/provisional-product-assumptions.md`:

- **PPA-1** — onboarding sequence Welcome → Language → Goal → Body → Activity →
  Pace → Food pref → Daily target (P-ONB-2).
- **PPA-2** — pace step shown only for "Lose weight"; other goals skip to food
  preference (P-ONB-1).
- **PPA-3** — minimum age 18; safe calorie floor 1200 (female) / 1500 (male);
  body input ranges age 18–100, height 100–250 cm, weight 30–350 kg
  (P-SAFETY-1). To be replaced by professional-input config.
- **PPA-4** — confidence thresholds per ADR-0004 (P-SCAN-2).
- **PPA-5** — canonical nav shell + meal slots per ADR-0003 (P-HOME-1, P-HOME-2).
- **PPA-6** — language selection persists in S0; UI strings ship in English
  (master §70).
- **PPA-7** — meal slots "Snack" and "Other" exist though the home design shows
  three slots.
- **PPA-8** — S0 seed catalog values are provisional placeholders; superseded by
  the Ethiopian FCT 2025 import in S1.
- **PPA-13** — the WW-03 weight screen is laid out provisionally from the
  behaviour contract's contents (P-WW-2 has no design), and its INS-02 weight
  highlight is stated as a fact rather than as praise or a warning. See
  `docs/plans/provisional-product-assumptions.md`.
- **PPA-14** — WW-01's adjustable water goal sits on the Home hydration card as
  a glass-sized stepper (3.0 L default, 1.5–4.0 L, disabled at the bounds),
  because P-WW-1 (dedicated water screen) has no design.
- **PPA-15** — INS-03's screen takes the request as two fields (calories left,
  protein still needed) prefilled from today's remaining budget instead of the
  free-text request the contract sketches, because parsing free text would need
  a model and no model is allowed to choose nutrition. Its ranking rules are
  documented in `what_can_i_eat.dart`.
- **PPA-16** — sign-in is a two-step number-then-code screen and the Profile tab
  is now the account surface. Signing in creates a real session but uploads
  nothing: the offline queue and sync engine are not built, and the screen says
  so instead of implying a backup.

### Pending behaviors blocking later slices

From `docs/behaviors/pending-behaviors.md`:

- **S0 blockers:** P-HOME-3 (Progress/Kitchen destinations have no shipped screen).
- **S2 blockers:** P-SCAN-1 (Edit Meal screen not designed), P-SCAN-3 (ADJUST vs EDIT).
- **S3 blockers:** P-AUTH-1 (auth screens not designed), P-OTP-1 (OTP provider/TTL),
  P-PROV-1 (payment provider launch set), P-SYNC-1 (offline premium grace).
- **S4 blockers:** P-INS-2 ("What Can I Eat" screen), P-WW-1 / P-WW-2 (dedicated
  water/weight screens), P-FREE-1 (plan feature boundaries).
- **Production blockers:** P-SAFE-1 (consent/privacy screens), P-RET-1 (imagery
  retention window), P-SUB-1 (paywall/subscription screens).
- **Logging lanes:** P-LOG-1..5 (text/voice/barcode/OCR/custom-food/calendar
  screens not designed).

### QA MINOR findings (accepted, deferred to S1+ polish)

From Gate C (`@qa` independent review, 2026-08-26) — 7 findings, none blocking:

1. File-level circular import `providers.dart` ↔ `onboarding_controller.dart`
   (safe/lazy; suggest constructor injection or `lib/controllers/` move).
2. HOME-03: no widget test for filled-slot aggregated totals /
   multi-items-per-slot (repo-level test + code inspection cover it).
3. WW-01: `todayMeals`/`todayWater` providers capture date key at build time —
   session open across midnight shows stale day until rebuild (save-time keys
   stay correct; display-only). **CLOSED 2026-09-20**: the day key is now its own
   notifier recomputed on app resume; a screen left open and untouched across
   midnight still shows the previous day until the next interaction, which is
   recorded in the provider's doc comment as the remaining limit.
4. PPA-7 surface: Home renders 4 slot rows (incl. Snack), design shows 3;
   "Other" has no Home row — needs `@vision` confirmation at UAT.
5. `strings.dart`: `honestVoidFeatures` Set declared but never referenced
   (dead code).
6. `notifications` void id falls to generic copy (calendar has dedicated
   copy) — cosmetic.
7. ONB-01: welcome content non-scrollable; could clip on very short
   viewports.

### S1 Gate D security findings (architect decisions recorded 2026-08-27)

- **F1 MEDIUM** — CLOSED 2026-08-31. `apps/api/docker-compose.yml` now binds
  `127.0.0.1:5432:5432` / `127.0.0.1:6379:6379` (architect-read verified);
  runtime containers loopback-only under compose project `api` (formerly
  orphan `infra`-project containers; data preserved via volume copy, infra
  volumes left intact as rollback). Evidence under Last Verification Evidence.
- **F2 LOW** — CORS prefix matcher (`env.ts` `origin.startsWith(prefix)`)
  allows lookalike origins (`http://localhost.evil.com`) with
  `http://localhost:*` config. No impact while API is unauthenticated
  read-only. **Architect decision: DEFER to S3** (must fix before S3 auth
  arrives — becomes an exploitable cross-origin boundary). Remediation
  recorded: exact URL protocol+hostname compare with port-wildcard only +
  e2e case.
- **F3 LOW** — CLOSED 2026-08-31. `apps/api/.dockerignore` added (`.env`,
  `.env.*`, `node_modules`, `dist`, `fct-downloads/`, `test/`); build-stage
  verification `NO_ENV` (ignore list honored; local `.env` exists and was
  excluded). Evidence under Last Verification Evidence.
- **F4 LOW** — validator lacks upper bounds on optional numeric
  fields/extraNutrients (defense-in-depth only; CLI-only import, committed
  reviewed data). **Architect decision: DEFER to S3** (thresholds need care;
  no invented numbers).
- INFO notes for the record: throttler in-memory storage (per-instance
  budgets — S3 deployment consideration); healthz unthrottled DB count
  (accepted tradeoff); Prisma LIKE wildcards in `q` (public data, bounded by
  limit); dev-log raw `q` echo (no PII in S1).

## Artifact Paths

- `docs/behaviors/*` — behavior contracts (product behavior source of truth).
- `docs/adr/*` — architecture decision records.
- `docs/plans/slice-s0-blueprint.md` — S0 blueprint (approved, 388 lines,
  ~115 files, ~50 test cases, 24 tasks T0–T24).
- `docs/plans/*` — execution contract, provisional product assumptions, and
  per-slice blueprints.
- `docs/swarm/STATE.md` — this file.
- `CONTEXT.md` — project context anchor.

## Last Verification Evidence

- **2026-09-24 — S3 pull transport and its live verification (this commit)**:
  - The read half of OFF-02 exists: `SyncApi.changes()` asks
    `GET /v1/sync/changes` (with an optional `since` cursor) and decodes it into
    `SyncChanges` / `RemoteChange` — meals with their items, water and weight,
    each carrying the `clientId` the device minted, plus a tombstone flag
    (`deletedAt`) and the `serverTime` cursor for next time.
  - Two things it deliberately refuses to fudge: a row with `deletedAt` set is
    **not** the same as a missing row (that distinction is what stops a deleted
    record from being re-created later), and a missing `serverTime` leaves the
    cursor unset rather than inventing one, because a cursor that advances
    without knowing what it covered would skip changes silently.
  - **Live, not mocked:** `tool/sync_live_check.dart` now reads the changes back
    through this client instead of a hand-rolled request. Against the API running
    from this checkout: push → `3 applied, 1 rejected — a meal needs at least one
    item`, then pull → `3 rows from this run` with
    `meal=true water=true weight=true incomplete-refused=true cursor=true`,
    `result: PASS`; the meal came back with its single item, and each row with the
    right `dateKey` and value.
  - Evidence: `flutter analyze` clean; `flutter test` **275/275** (271 before:
    four pull tests — parsing with tombstones and ids intact, the `since`
    parameter, an empty answer, and a refused pull reporting the server's code).
  - **What this is not:** an apply step. Nothing yet writes a remote row into the
    local tables, so restore-onto-a-new-device still does not exist and the
    account screen's "a backup, not a sync" copy remains true. The *Next Session*
    block below covers the apply half.


- **2026-09-20 — honesty sweep of the remaining voids (this commit)**:
  - Sign-in is built, so the welcome screen's "I ALREADY HAVE AN ACCOUNT" no
    longer opens a void that claimed accounts were "coming soon": it opens the
    real sign-in screen. That meant un-gating `/sign-in` — it depends on nothing
    local, and a returning user must be able to sign in before finishing setup on
    this device — while every app screen stays gated. Two tests that asserted the
    old void were replaced by ones asserting the new behaviour (sign-in reachable
    pre-onboarding; `/weight` still bounced).
  - The TAKE PHOTO void said "photo analysis is coming soon", which was untrue:
    analysing a photo the user picks already works. It now names what is actually
    missing (the in-app camera screen, SCAN-02) and points at the lane that works.
  - The dead `honestVoidFeatures` set and the notifications void's generic copy
    (QA findings 5 and 6) were already resolved in earlier work; finding 3 is
    closed above, leaving findings 1, 2, 4 and 7 open in the ledger.
  - Evidence: `flutter analyze` clean; `flutter test` **271/271**.


- **2026-09-20 — QA finding 3 closed: "today" is no longer frozen at build time
  (this commit)**:
  - The day key the dashboard, water card and meal list all read used to be
    computed inside each provider's build, so a session left open across midnight
    kept showing the previous day's meals and water. It is now a notifier
    (`todayKeyProvider`), recomputed when the app is **resumed** — the moment a
    user returning after midnight actually looks at it.
  - The remaining limit is stated rather than hidden: a screen left open and
    untouched across midnight still shows the previous day until the next
    interaction. Closing that too would need a midnight timer, i.e. a wake-up the
    app does not otherwise need — recorded in the provider's own doc comment.
  - Evidence: `flutter analyze` clean; `flutter test` **271/271** (269 before:
    the day key follows a refreshed clock, and the meal list follows the day
    across midnight when the app is resumed, pinned end to end through the
    widget tree).

- **2026-09-20 — session lifecycle: a dead session is cleared, not left
  "unconfirmed"**:
  - The launcher's restore path now separates two cases it had been treating as
    one. If the server refuses the session itself (`TOKEN_REUSED`,
    `ACCOUNT_DISABLED`, or a refused rotation), the stored tokens are deleted and
    the user is told the session ended and to sign in again. If the server simply
    cannot be reached, the session is kept and the screen says "signed in, not
    confirmed" — which is true, and is why the two cases must not share copy.
    Previously a revoked session stayed on disk forever, showing an account
    screen that could not back anything up and giving no reason.
  - Evidence: `flutter analyze` clean; `flutter test` **269/269** (268 before:
    the revoked-session test replaced a weaker one and an offline-session test
    was added). Both cases are pinned: revoked → tokens gone, signed out, reason
    shown; offline → tokens kept, `isUnconfirmed` true.


- **2026-09-20 — full-tree verification sweep at `b6ee42f` and the UAT packet**:
  - Sweep, every suite run one after another at this commit: mobile
    `flutter analyze` clean and `flutter test` **268/268**; domain **27/27**;
    design-system **13/13**; API lint clean, build clean, `prisma validate`
    valid, unit **91/91**, e2e **83/83**, `npm audit` **0 vulnerabilities**;
    node `scripts/*.test.mjs` **9/9**; `apps/website/test/*.test.mjs` **12/12**;
    `generate-latest-json.mjs --check` OK (`published=false, android=false,
    ios_installable=false`); html-validate exit 0 across the website pages.
  - `docs/uat-checklist.md` written: 30 numbered checks across onboarding,
    logging, home/targets/water/weight, insights, account/backup and
    safety/honesty, each with the expected result, plus the honest limits
    (no AI key, no SMS gateway, no release pipeline run) labelled as **EXPECTED
    LIMIT** rather than quietly skipped. **No check in that file has been
    executed by an agent** — the UAT gate is a human's, and the file says so, and
    check 5.12 (restore onto a fresh install) is listed as *must fail today*
    because pull is not built.
  - **Native build verified** (the gap left open when the secure-storage plugin
    arrived): `flutter build windows --debug` succeeded — 148s, `nourish_mobile.exe`
    produced, and `flutter_secure_storage_windows_plugin.dll` is among the linked
    plugin DLLs alongside `sqlite3`, `url_launcher_windows` and
    `file_selector_windows`. The dependency had only ever been exercised through
    Dart tests before this; it is now known to compile and link into a real
    target. Android release builds remain CI's job (`android-ci.yml`) and have
    not been run here.
  - Nothing merged: `master` is still at `1c16902`.


- **2026-09-20 — S3 offline queue and backup push (OFF-02, this commit)**:
  - Every local change now leaves a queued operation behind, written in the same
    transaction as the change itself: meal saves, meal deletes (a tombstone,
    because a deleted row leaves nothing to notice), water additions and
    removals (signed amounts, matching the device's own audit trail) and weight
    entries. The operation stores the exact wire body, so what is pushed later
    is what was queued.
  - Identity is install-scoped: `clientId` is `<12-char device id>:<table>:<row>`
    generated once and kept locally, and each meal item carries its own id. Two
    devices can therefore never collide into one server row, and the same local
    row keeps its identity across pushes.
  - The engine pushes in insertion order, in batches, and takes the server's word
    for each operation: `applied` and `ignored-stale`/`unchanged` are done (a
    stale operation is not a failure to retry), a refusal keeps the operation
    queued with the server's reason, and an operation the server does not answer
    for stays queued — silence is not acceptance. An expired access token is
    rotated once and the same batch retried. With no stored session the queue
    simply waits, so a meal logged before signing in is still backed up later.
  - The account screen gained a backup panel that reports the queue's own count,
    backs up on request, and says plainly that this is **a backup, not a sync**:
    restoring onto a new device is not built. A session the server could not
    confirm (offline) now reads "signed in, not confirmed" instead of claiming
    the user has no account.
  - **Live verification, and it earned its keep:** `tool/sync_live_check.dart`
    signed in against the API running from this checkout, pushed a meal, a water
    log, a weight entry and one deliberately incomplete meal, then read the
    changes back. Result: `3 applied, 1 rejected — a meal needs at least one
    item`, and the pull showed all three rows with the right `dateKey` and
    values, the meal with its item. The first run **failed** and exposed two real
    client bugs the fakes had hidden: the server requires a `clientId` on every
    meal **item**, and refusals come back in a separate `rejected` array with a
    `reason` field rather than as an `applied` outcome. Both are fixed, and the
    fakes in the tests now use the server's real two-array shape so they cannot
    hide it again.
  - Evidence: `flutter analyze` clean; `flutter test` **268/268** (246 before:
    11 queue tests, 8 engine tests, 3 backup-panel widget tests). Drift schema
    v5 (additive table).
  - **Still not built:** the pull half. `GET /v1/sync/changes` is implemented and
    tested server-side and the live check read it, but the device never applies
    remote rows: no restore onto a fresh install, no two-device reconciliation.
    That is the half where a mistake corrupts a user's own records, so it gets
    its own pass with a real merge test. The account screen says so.


- **2026-09-20 — full-tree verification sweep at `79a725d` (whole repository,
  every suite, run one after another)**:
  - Mobile: `flutter analyze` clean, `flutter test` **246/246**. Domain
    **27/27**, design-system **13/13**.
  - API: lint clean, build clean, `prisma validate` valid, unit **91/91**,
    e2e **83/83**, `npm audit` **0 vulnerabilities**.
  - Tooling: node `scripts/*.test.mjs` **9/9**, `apps/website/test/*.test.mjs`
    **12/12**, `generate-latest-json.mjs --check` OK
    (`published=false, android=false, ios_installable=false`), html-validate
    exit 0 across the six website pages.
  - This is the state the working tree is in; nothing is merged to `master`,
    which still points at the S0 release commit.


- **2026-09-20 — S3 device accounts and sessions (AUTH-01/02/03, this commit)**:
  - The app can now sign in for real. `AuthApi` (the third and last egress seam,
    under `lib/data/sources/`) speaks the documented endpoints; the number is
    sent exactly as typed and the server normalizes it, because AUTH-01 says
    identity is the server's decision, not the device's.
  - Tokens live only in platform secure storage (Android Keystore / iOS
    Keychain) behind a `TokenStore` seam, so the widget tests never touch a
    keychain and there is exactly one implementation that writes to disk.
  - Launch restores a stored session by asking the server who it is; an expired
    access token is rotated once, and a session that cannot be confirmed leaves
    the app signed out with the reason shown rather than a green tick over a
    dead session. Sign-out clears the device even when the server is
    unreachable, and says so when the server session outlived it.
  - The Profile tab stopped being an honest void and became the account surface:
    the normalized number, the plan, the consent flag and the device count, all
    reported exactly as the server holds them. It also states plainly that
    nothing is uploaded yet — because the offline queue and sync engine are not
    built, and a screen that implied a backup would be lying.
  - **Live verification (not a mock):** the API was started locally with the
    console SMS gateway and the real client was driven against it by
    `apps/mobile/tool/auth_live_check.dart` — `requestOtp` → 202 with the
    normalized number, `verifyOtp` → tokens + account (`plan free`,
    `consent false`, 1 session), `GET /v1/me` with the issued access token,
    `refresh` → rotated token, replaying the old refresh token → refused with
    `TOKEN_REUSED`, `logout` → session ended. A wrong code was then refused with
    `OTP_INVALID — That code is not valid. 4 attempts left.`, and the app now
    surfaces the server's own count instead of replacing it with its own copy.
  - Evidence: `flutter analyze` clean; `flutter test` **246/246** (222 before:
    8 API-client tests, 8 controller tests, 8 sign-in widget tests, plus the
    shell test updated for the real Profile screen). The live check ran against
    the API started from this checkout; the dev server was stopped afterwards
    and Docker's containers were left up, loopback-only.
  - **Still not built (S3 device side):** the offline queue and the sync engine.
    Nothing is uploaded from the device: meals, water, weight and the water goal
    remain local-only. `POST /v1/sync` and `GET /v1/sync/changes` are implemented
    and verified server-side (see the S3 backend block) but no client calls them.
  - **Not verified anywhere:** real SMS delivery — no gateway credential exists
    in this environment, so the live check used the console gateway, which logs
    the code locally.


- **2026-09-20 — S4 "What can I eat" (INS-03, this commit)**:
  - The last designed-source behaviour of S4 is now built: suggestions are drawn
    from Nourish's own food table and constrained by the remaining calorie
    budget, the remaining protein need, the user's food preference, the meal
    being planned and what they logged in the last three days. Ethiopian foods
    are prioritized unless the user chose international, exactly as INS-03 says.
  - No model is involved anywhere in the path — the ranking is a pure function
    pinned by 13 unit tests, and the numbers a suggestion shows are the numbers
    logging it would record, because both go through the same domain engine.
  - The acceptance example is a test, not a claim: with 500 kcal left and 35 g of
    protein needed, every suggested food fits inside 500 kcal and the list
    together covers at least 35 g (`usedKcal ≤ 500`, `coveredProteinG ≥ 35`).
    Building the combination density-first is what makes that true — an earlier
    rank-order greedy under-covered the gap (22 g of 35 g) and the test caught
    it before it shipped.
  - Both dead ends are honest: a spent budget says so and suggests nothing
    (with distinct copy when the target is already clamped to the SAFE-01 floor,
    so the app never nudges such a user to eat less), and when nothing fits, the
    closest foods are listed with how far over budget they are rather than
    inventing a food.
  - The request is two fields (calories left, protein still needed) prefilled
    from the user's own remaining budget — PPA-15, because the contract's
    free-text request would need a model to parse.
  - Evidence: `flutter analyze` clean; `flutter test` **222/222** (205 before:
    13 INS-03 unit tests, 4 widget tests over the real seeded catalog);
    `flutter test` for domain 27/27 and design-system 13/13 unchanged. Egress
    confinement unchanged: the recommender reads only local Drift tables.


- **2026-09-20 — S4 water goal (WW-01 adjustability, this commit)**:
  - The Gate A deviation that deferred the water goal ("fixed at 3.0 L in S0")
    is now closed: the goal is the user's own value, adjustable a glass at a
    time and applied from today onward, exactly as WW-01 states.
  - Stored on the existing profile row (Drift schema v4, additive nullable
    column) rather than in a new table, and read through the profile stream so
    the card updates as soon as the value changes. `NULL` means "never set" —
    deliberately different from "set to the default", so the documented default
    can change later without overwriting a user's own choice.
  - Stepping is optimistic and serialized in one notifier, so two quick taps
    accumulate instead of both computing from the same stale value, and a failed
    write reverts to what is actually stored with a snackbar. The control is
    disabled at its bounds rather than silently ignoring a tap.
  - The consumed-water stream is deliberately NOT derived from the goal: an
    earlier version recreated it on every change, which blanked the card to a
    spinner on each tap (caught by a hanging `pumpAndSettle`, not by review).
  - Range 1.5–4.0 L with the EFSA adequate-intake figures recorded where the
    bounds are defined; the range rules out impossible daily goals, it does not
    assert a recommendation. Placement and bounds are PPA-14 (P-WW-1 has no
    design).
  - Evidence: `flutter analyze` clean; `flutter test` **205/205** (194 before:
    8 new water-goal unit tests, 3 new hydration-card widget tests, plus the
    earlier weight suite); domain 27/27; design-system 13/13. Runs were
    reproduced from a log file after a `Select-Object -Last` pipeline hid a
    genuine hang — the hang was the bug, not the harness.


- **2026-09-20 — S4 insights (`1db8429`, `deb9800`) and weight logging
  (WW-03, this commit)**:
  - **INS-01 / INS-02** shipped as a real dashboard over the user's own records:
    caloric balance with a dashed target line and over-target days flagged, macro
    averages against the target, data-backed highlights, dietary diversity. No
    server aggregate, no model, no placeholder. **P-INS-1 resolved as the
    architect and pinned by tests:** an un-logged day is NOT a zero-consumption
    day — it draws no bar, and averages divide by logged days while the window
    size stays honest. A partly elapsed window is labelled, not presented as a
    full week. The dashboard is not computed at launch: the shell builds its
    pages lazily and recomputes when the Insights tab is opened (`deb9800`).
  - **WW-03** shipped: an append-only weight history (Drift schema v3), pure
    trend maths (per-day mean of same-day entries, trailing 7-day smoothing,
    append-order-independent), weekly/monthly windows, and a provisional screen
    reachable from a Home dashboard card. SAFE-01 range 30–350 kg is enforced at
    the field and in the repository, so an out-of-range value never reaches the
    table. The ±0.5 kg noise rule is a single shared constant: inside the band
    the copy is neutral, and no highlight is emitted at all. History is ordered
    by measured day rather than by typing order, so a back-filled entry keeps its
    own date instead of becoming "current". Nothing is seeded from the onboarding
    answers — the history holds weigh-ins the user actually made.
  - **INS-02 ← WW-03**: the dashboard now carries the weight trend as an
    `informational` highlight (new [HighlightKind] value) that states the move
    and the number of weigh-ins. It is deliberately not positive/cautionary:
    whether "down" is good depends on the user's goal, which the dashboard does
    not hold, so it does not judge.
  - Evidence: `flutter analyze` clean; `flutter test` **194/194**, up from the
    155 on `deb9800` — 15 new weight-trend unit tests, 11 weight-repository
    tests over a real in-memory Drift database, 7 weight-screen widget tests
    (entry stored and read back, out-of-range refused at the field with nothing
    written, weekly vs monthly windows, the Home card following a saved entry,
    onboarding gating), 4 weight-highlight unit tests and 2 insights widget
    tests (a clear move is highlighted, a ±0.2 kg fluctuation is not); PPA-13
    recorded. Egress confinement unchanged — the weight feature adds no network
    surface and reads only local Drift tables.
  - **Honest gaps (not fixed, not pretended):** the WW-03 screen layout is
    provisional (P-WW-2 has no design); the weekly view is the default because
    the design is silent on it; WW-01 water-target adjustability, INS-03
    ("What can I eat", P-INS-2) and water reminders (WW-02) are still open; S3's
    device side (sign-in screens, secure token storage, the offline queue and its
    sync engine) is still not built, so nothing syncs in the app yet.
  - **Not verified anywhere:** no AI provider key and no SMS gateway credential
    exist in this environment, so recognition and real SMS delivery remain
    implemented-but-not-exercised.

- **2026-09-19 — S3 backend: accounts, sessions, sync (commits `d2aeb3e`,
  `299e830`; decisions in `docs/adr/0008-…`)**:
  - **AUTH-01/02/03** shipped: one normalization function decides identity (the
    contract's own example `0911 23 45 67` → `+251911234567`), six-digit codes
    stored only as salted hashes for their validity window, `SmsProvider` seam
    (`none` → 503, `console` refused in production, `http` gateway), rotating
    refresh chains with reuse detection, and server-owned entitlement/consent.
  - **OFF-02** shipped: `POST /v1/sync` applies the device's queue in order
    (idempotent by client id, device-clock last-write-wins, tombstones, per-op
    rejection instead of a dropped batch); `GET /v1/sync/changes` returns what
    the device has not seen, tombstones included.
  - Evidence: api lint clean, build clean, `prisma validate` valid, unit 91/91,
    e2e 83/83, `npm audit` 0. Live over HTTP with the console gateway: request →
    code from the dev log → verify → account `plan=FREE`,
    `aiImprovementConsent=false` → `GET /v1/me` → push a meal → pull it back
    (`kcal=350`) → rotate the refresh token → replaying the old one returns
    `TOKEN_REUSED`.
  - **Not built**: the device side (sign-in screens P-AUTH-1 undesigned, secure
    token storage, the offline queue and its sync engine). S3 is therefore
    *backend-complete, product-incomplete*, and nothing syncs yet in the app.
  - **Not verified anywhere**: real SMS delivery — no gateway credential exists
    in this environment, so the flow is tested with a capturing provider and the
    `http` gateway is configuration rather than exercised code.
  - Bug found by running the suite: `@nestjs/jwt` v12 ships ESM-only and breaks
    the CommonJS test and runtime path; pinned to the v11 line.

- **2026-09-19 — S2 photo lane, S5, and the deferred S1 security findings**:
  - **S2 photo lane** (`a785d51`): `ImageAcquisitionService` seam over the
    platform picker (downscale ≤1280 px + JPEG re-encode + metadata capture
    disabled = SCAN-03 done natively before the bytes reach Dart);
    `PhotoCaptureScreen` opens the picker, runs the existing pipeline and shows
    the result; cancelling changes nothing and returns to the origin. The scan
    sheet now *pushes* its lanes so "back" is meaningful for every one of them.
    TAKE PHOTO / USE VOICE / SCAN BARCODE remain honest voids — SCAN-02's
    designed capture screen is not built and substituting the system camera UI
    would be a silent redesign. Mobile 137/137 (3 new). The real picker is only
    exercised through a fake: opening a gallery needs a device.
  - **S5** (`9aae4a6`): `releases/latest.json` + a validating generator
    (`scripts/`), the static website (`apps/website`, 6 pages, no cookies, no
    analytics, bundled fonts and approved Stitch screens), three workflows
    (`build-release.yml`, `android-ci.yml`, `website.yml`) and the in-app update
    check (REL-03) with a tested launcher seam. Evidence: 21 node tests across
    the release metadata, the download rules and the generator↔website contract;
    `--check` OK; html-validate clean on all 6 pages; all four workflow files
    parse; mobile 134/134 at that commit. **The pipeline itself has never run** —
    it needs a remote and the secrets in `docs/release-process.md`.
  - **S1 findings closed** (`b5508e3`): F-07 (CORS prefix match admitted
    `http://localhost.evil.com`) and F-04 (unbounded optional nutrients) — both
    recorded by the S1 security review as "must fix before S3". Verified against
    the running API: legitimate localhost origins allowed, lookalikes blocked.
    API unit 67/67, e2e 56/56.
  - **Still open**: S3 (auth, OTP, token rotation, server-side meals, offline
    queue sync) and S4 (dedicated water/weight screens, insights,
    recommendations, entitlements UI). Their designs: auth screens (P-AUTH-1),
    water/weight (P-WW-1/2), paywall (P-SUB-1) do not exist, so those slices need
    either provisional designs (the PPA pattern) or the missing Stitch screens.
    `insights_dashboard` **is** designed and is the natural first piece of S4.
  - **Environment reality for the next session**: no AI provider key exists, so
    the real recognition path is implemented and unit-tested against a mock but
    has never been exercised against a model; Docker containers
    (`nourish-postgres`, `nourish-redis`, compose project `api`) are left
    running, loopback-only.

- **2026-09-19 — S1 completed, QA blockers fixed, committed (`c61c996`)**:
  - Independent QA (`docs/swarm/qa-report-s1.md`) returned `QA REJECTED` with 2
    BLOCKERs, both real:
    - **F-01** — the committed FCT extract mis-assigned the published nutrient
      columns (a systematic one-to-two column left shift): `doro_wot` shipped
      `sodiumMg: 0.62` where the FCT publishes Na = 332, `egg` shipped
      `ironMg: 138` where the FCT publishes Fe = 1.8. The macro block was
      correct 18/18; only minerals / phytate / fatty acids were shifted.
    - **F-02** — the "double-entry verification" script spot-checked code + kcal
      only, so it could not have caught F-01.
  - Fixes: the extractor now assigns each printed value to the column whose
    x-span contains it (empty cells stay empty); both JSONL files re-derived
    from the re-acquired PDF (sha256 verified); `verify-extract.mjs` rewritten
    to compare **every** nutrient column against FAO's published text layer.
    Final run: 722 rows, 3 510 row/block pairs compared, 3 483 exact matches,
    **27 571 values verified one-by-one, 0 values matching no published value**,
    38 pairs explicitly reported as intractable for the text layer, exit 0.
    Regression tests pin the published values for 070152 / 080001 / 010109 and
    assert `extraNutrients` deep-equality DB↔fixture (F-06).
  - Also fixed: mobile catalog mapper now honours the server's canonical id
    (QA Q1 — 18/18 ids diverged, orphaning S0 meal references); catalog payload
    integrity check + shrink guard (F-05); LIKE-wildcard escaping (F-08);
    bounded `page` (F-09); RFC-quoted ETag with tolerant matching (F-10);
    `npm audit` gate retry (F-15).
  - Evidence: api lint/build clean, `prisma validate` valid, unit 21/21,
    e2e 40/40, `npm audit` 0 vulnerabilities; domain 27/27; design-system 13/13;
    mobile 116/116 (+4 mapper contract tests against a real captured payload).
- **2026-09-19 — S2 API committed (`015090e`)** and **S2 mobile committed
  (`58f8f95`)**:
  - Provider seam (`none` | `openai-compatible` | `fixture`), the fixture
    provider refused when `NODE_ENV=production`; off-schema AI output, including
    output that tries to supply nutrition, fails the run with
    `AI_INVALID_OUTPUT`; unresolved candidates stay unresolved.
  - Endpoints: `POST /v1/analyses`, `GET /v1/analyses/:id`,
    `POST /v1/analyses/:id/corrections` (anonymous, no imagery persisted,
    per-route rate limit + daily budget guard, `analysis:purge` retention CLI).
  - Mobile: text logging (LOG-01), the transactional progress → result →
    low-confidence flow (SCAN-04/05/06), edit-before-save (SCAN-07), all
    recomputed locally by the domain engines.
  - Evidence: api lint/build clean, unit 56/56, e2e 56/56, `npm audit` 0;
    mobile analyze clean, 123/123; domain 27/27; design-system 13/13; egress
    grep shows exactly two `http` imports, both inside `lib/data/sources/`;
    0 STUB/TODO markers; 0 raw-SQL matches.
  - **Honest gaps (not fixed, not pretended):** no live AI provider key exists
    in this environment, so the real recognition path is implemented and
    unit-tested against a mock but has never been exercised against a model;
    TAKE PHOTO / CHOOSE PHOTO / USE VOICE / SCAN BARCODE still open honest
    voids; S3 (auth + sync), S4 (water/weight + insights) and S5 (website +
    release infrastructure) are not started.

- Gate A (blueprint): architect hand-verified the 12 target-engine cases
  (BMR/TDEE/clamps/macros).
- Baseline commit: `25e27c8`.
- **Gate B part 1 (`packages/domain`)** — DONE, uncommitted:
  - `dart analyze` → `No issues found!`
  - `flutter test` → `+27: All tests passed!` (12 target-engine incl. both
    safety clamps, 5 portion, 5 nutrition, 5 snapshot-immutability)
  - Genuine TDD red→green recorded: pace-deficit sign bug (negative
    `kcalPerDay`) found and fixed via `.abs()`; expected values match blueprint
    exactly (2140 / 2090 / 1590 / clamp 1200 / clamp 1500 / 2350 / macros
    125-225-67).
- **Gate B part 2 (`apps/mobile` core + placeholder design-system)** — DONE,
  uncommitted:
  - `flutter analyze` → `No issues found!` (0 issues)
  - `flutter test` → `+50: All tests passed!` (seed idempotency, EN+AM alias
    search, snapshot capture 225/281/350 + immutability, water floor 0, target
    derive 2140 + re-derive preserves history, date utils, router resume)
  - Zero-egress grep: zero `http`/`dart:io`/`HttpClient` matches in
    `apps/mobile/lib`
  - Deviations accepted: flutter_riverpod 2.6.1 (3.x line has an unsatisfiable
    `test` runtime dep with build_runner+drift_dev on this SDK — solver-proven);
    drift_flutter 0.3.1; seed rounding per half-away-from-zero (Shiro 281, Misir
    216 — matches design cards via the pinned rounding rule).
  - `graphify` not installed on this machine — recorded as limitation, not run.
- **Gate B part 3 (UI)** — COMPLETE 2026-08-26 (see gates B–E evidence block
  below).
- **2026-08-26 — Session resume sanity check (architect, pre-dispatch)**:
  - `flutter analyze` `apps/mobile` → `No issues found!`
  - `flutter test` `apps/mobile` → `+50: All tests passed!`
  - `flutter test` `packages/domain` → `+27: All tests passed!`
  - Git: 2 commits (`f493342` checkpoint, `25e27c8` baseline); `apps/` +
    `packages/` still uncommitted per commit policy.
  - Confirmed 16/16 feature files carry `// STUB` markers;
    `packages/design-system/lib` is still the placeholder with
    `buildNourishThemeStub()`.
  - Note: Gate B part 3 re-dispatched to `@designer` with full recorded brief
    (design-system package, 16 screens, widget tests, fonts, zero-egress).
- Gates C (QA), D (security record), E (integration): COMPLETE 2026-08-26
  (see below). Gate F (commit): imminent, pending architect execution.
- Environment checks:
  - Flutter 3.44.8 (stable)
  - Node v24.16.0
  - npm 11.13.0
  - git 2.55.0.windows.5
- **2026-08-26 — Gates B part 3, C, D, E evidence**:
  - Gate B part 3 (UI) — COMPLETE by `@designer`; architect independently
    verified:
    - `flutter analyze` `apps/mobile` + `packages/design-system` →
      `No issues found!`
    - `flutter test` → `+87` (apps/mobile), `+13` (packages/design-system),
      `+27` (packages/domain)
    - Zero-egress grep: zero matches; STUB/TODO/PLACEHOLDER grep: zero
      matches; 5 fonts present (324–365 KB).
  - Gate C (QA) — `QA APPROVED` (independent `@qa`): full blueprint §16
    matrix covered; suites reproduced (+87 mobile, +13 design-system, +27
    domain); analyzers clean; extended zero-egress grep zero matches; 7
    MINOR findings, none blocking (see `## Unresolved Risks`). Designer
    deviations adjudicated ACCEPTABLE/CORRECT (`/welcome` redirect per
    ONB-09; skip-pace null persistence per ONB-06/engine §8).
  - Gate D (security) — `SECURITY NOT REQUIRED` recorded for S0: zero
    network egress (architect + QA double-verified); no secrets/tokens; no
    auth/permissions; no remote code/uploads; no external inputs. Residual
    provisional risk: health data in app-private local SQLite unencrypted at
    rest (blueprint §14) — deferred to S3; re-open if any runtime network
    call or secret appears.
  - Gate E (integration) — PASS by architect: both packages compile/analyze
    clean together; router contract intact (16 const-constructed screens);
    provider graph acyclic with 22 uniquely-named providers; greenfield Drift
    schema v1 (no migrations); 87 mobile tests cover integrated paths incl.
    end-to-end widget flows; no unresolved TODO/stub in shipped paths
    (honest-void lanes intentional); branch contains only intentional
    changes (untracked `apps/`, `packages/`; `STATE.md`).
  - `graphify` unavailable — limitation recorded (not run, not pretended).
- **Gate F (commit)** — COMPLETE 2026-08-26:
  - Commit hash: `80800d4` — `feat: S0 — foundation, onboarding, home, and
    manual logging (offline MVP)` on `feat/nourish-mvp`
  - Atomic: 231 files in one commit; working tree clean after commit.
  - `.gitignore` updates: root + both packages — `pubspec.lock` COMMITTED
    (blueprint §7 reproducible builds; 3 lock files included).
  - Pre-commit hygiene: 0 forbidden artifacts staged (no
    build/.dart_tool/ephemeral/.idea/.env); ephemeral iOS env artifact
    confirmed gitignored.
- **2026-08-26 — UAT + Release (S0)**:
  - UAT (S0): APPROVED by human (explicit "i approve" after hands-on review
    offer; PPA-1..8 surfaced, incl. PPA-7 slot-row question for `@vision`;
    approval recorded as covering the slice as built; PPA items remain
    tracked for product-level refinement).
  - Release (S0): `@devops` evidence — `master` fast-forwarded
    `25e27c8 → 1c16902` (ff-only, 240 files); annotated tag `v0.1.0-s0` →
    commit `1c16902`; both branch tips identical at `1c16902`; working tree
    clean; repo left on `feat/nourish-mvp`; rollback documented
    (`git checkout master && git reset --hard 25e27c8 && git tag -d
    v0.1.0-s0`).
  - Deployment: NONE this phase — no remotes configured; store release infra
    is S5 (no unsigned artifacts).
- **Gate A (S1)** — APPROVED 2026-08-26: plan research (FCT 2025 publicly
  obtainable via EPHI/FAO; Docker CLI present, daemon off; environment
  reconfirmed); blueprint + ADR-0006 written by @scribe from @plan's
  architect-approved content (plan agent's mode blocked writes — recorded
  limitation); architect decisions D1–D5.
- **2026-08-26 — S1 Gate B dispatch SESSION CHECKPOINT** (architect-verified
  facts, scribe-recorded):
  - S0 remains fully complete and RELEASED (`v0.1.0-s0`, `master`
    fast-forwarded at `1c16902`) — NO changes.
  - S1 Gate A COMPLETE: `docs/plans/slice-s1-blueprint.md` (525 lines) +
    `docs/adr/0006-fct-import-and-catalog-authority.md` approved; D1–D5
    resolved.
  - Track A (`apps/api`) — DID NOT EXECUTE: `@build` subagent returned without
    building, citing its charter (`.opencode/agents/build.md` denies task
    delegation except qa/security) and a misinterpreted delegation
    instruction. Verified: ZERO files under `apps/api/` created/modified.
    Re-dispatch required with a self-contained brief explicitly forbidding
    any subagent delegation.
  - Track B (`apps/mobile`) — INTERRUPTED mid-flight (user-initiated session
    save); WIP UNVERIFIED. MODIFIED: `lib/bootstrap/bootstrap.dart`,
    `lib/core/date_utils.dart`,
    `lib/data/daos/{food,meal,profile,target,water}_dao.g.dart`,
    `lib/data/database.dart`, `lib/data/database.g.dart`,
    `lib/data/repositories/food_repository.dart`,
    `lib/data/seed/seed_catalog.dart`, `lib/data/seed/seed_importer.dart`,
    `lib/data/tables/tables.dart`,
    `lib/features/onboarding/onboarding_controller.dart`,
    `lib/features/search/food_search_screen.dart`,
    `lib/features/welcome/welcome_screen.dart`, `lib/l10n/strings.dart`,
    `lib/main.dart`, `lib/providers.dart`, `pubspec.yaml`, `pubspec.lock`,
    `test/food_repository_test.dart`, `test/meal_repository_test.dart`,
    `test/seed_importer_test.dart`,
    `windows/flutter/generated_plugin_registrant.*`. NEW/UNTRACKED:
    `lib/core/clock.dart`, `lib/data/sources/`, `lib/data/sync/`,
    `test/catalog_sync_test.dart`, `test/clock_provider_test.dart`,
    `test/home_meals_totals_test.dart`, `test/offline_search_fallback_test.dart`,
    `test/welcome_scroll_test.dart`, `test/widget/notifications_void_test.dart`.
    NONE committed; NONE verified.
  - T0 Docker preflight: STILL PENDING — Docker Desktop installed
    (`C:\Program Files\Docker\Docker\Docker Desktop.exe`) but daemon NOT
    running at last check; no native Postgres.
  - Git status summary: uncommitted — `docs/plans/slice-s1-blueprint.md`,
    `docs/adr/0006-*`, mobile Track B WIP set (above); S0 released state
    unchanged (`master` @ `1c16902`).
  - **Gate B (S1) NOT complete — nothing beyond S1 Gate A is closed.**
- **2026-08-27 — S1 Track B resume verification (architect)**:
  - Track B (`apps/mobile`) finished by a @build finish-dispatch
    (architect-scoped); architect-verified COMPLETE. Fixes applied:
    - (a) `lib/providers.dart` — added missing
      `import 'data/sources/catalog_data_source.dart';` (interface
      unresolved).
    - (b) `test/offline_search_fallback_test.dart` — removed unused
      api_catalog_data_source import; `PortionUnit.handful` →
      `PortionUnit.serving` (2 spots; `handful` is not in the locked domain
      enum); removed `const` from `NutritionPer100g(...)` (domain class is
      deliberately non-const).
    - (c) `test/welcome_scroll_test.dart` — removed unused test_helpers
      import.
    - (d) `test/catalog_sync_test.dart` — fixture unit strings `'handful'` →
      `'serving'` (4 occurrences) + expected portion list updated —
      test-contract fix forced by locked domain (mapper correctly skips
      unknown units per blueprint §8, never crashes).
    - (e) `lib/features/voids/honest_void_screen.dart` — wrapped in
      LayoutBuilder → SingleChildScrollView → ConstrainedBox(minHeight:
      viewport) → IntrinsicHeight → Center; fixed a real 44px RenderFlex
      overflow at 320×480 hit by the M7 welcome test; no behavior change on
      tall screens.
  - Deviations adjudicated ACCEPTABLE by architect: (d) test-contract fix
    forced by locked domain enum; (e) honest-void scroll wrapper.
  - Verification (architect-run):
    - `flutter analyze` `apps/mobile` → `No issues found!` (ran in 5.8s)
    - `flutter test` `apps/mobile` → `+107: All tests passed!` (107 total)
  - Blueprint §6 mobile deltas verified present by @build and accepted by
    architect: CatalogDataSource seam, local/api implementations,
    FoodRepository consuming the seam, catalog_sync_service/state wired into
    providers + bootstrap (fire-and-forget), clock.dart + clockProvider
    (M3), footer copy swap seedDisclaimer→fctCitationFooter (M6), M7 welcome
    scroll.
  - `packages/domain` and `apps/api` untouched (git status/diff verified —
    zero paths outside apps/mobile). Working tree uncommitted per commit
    policy.
- **2026-08-27 — S1 Gate B (Track A) + Gate D evidence + session save**:
  - Track A gate outputs: lint/build/prisma-validate clean; `npm test`
    19/19; `npm run test:e2e` 31/31; `npm audit` 0 vulnerabilities; live
    smoke list evidenced green (healthz, doro wet EN+AM A6, categories,
    catalog 304, 404/400 envelopes).
  - FCT acquisition: FAO openknowledge bitstream (handle
    `20.500.14283/cd9308en`); PDF sha256
    `66A1EBF351C09212F323E33019AE47CA60232D84344EB98CAF3A55C90936CF97`;
    license CC BY 4.0 (FAO record metadata); coverage 722 of 727 condensed
    rows (5 Excel-only rows never presented as full catalog); 23 rows
    without usable kcal excluded; 18/20 S0 foods matched (avocado/banana
    kJ-only, remain seed-bootstrap).
  - Gate D verdict: SECURITY PASS (independent @security). F1 MEDIUM
    (compose `0.0.0.0` bind — fix before Gate F); F2 LOW (CORS prefix
    lookalike — defer S3); F3 LOW (no .dockerignore — fix before Gate F);
    F4 LOW (validator upper bounds — defer S3).
  - Gate C (QA): cancelled mid-run during session save; zero evidence
    produced; re-dispatch on resume.
  - Docker: `nourish-postgres` (postgres:16-alpine) + `nourish-redis`
    (redis:7-alpine) UP healthy (4+ hours), bound `0.0.0.0:5432/6379` (F1
    tracked). E2E infra ready on resume; no T0 preflight needed unless the
    machine reboots (then: start Docker Desktop, poll `docker info` ≤180s,
    `docker start nourish-postgres nourish-redis`).
  - Git: HEAD `56a6a6b` (`chore: checkpoint S1 planning (Gate A) + Gate B
    WIP state (session save)`); ~40 uncommitted paths (Track B mobile set +
    `apps/api/**` + `.github/workflows/api-ci.yml` + docs); nothing
    committed since the last checkpoint.
- **2026-08-31 — S1 resume: F1/F3 closure + Gate C re-dispatch attempts (session save)**:
  - T0 preflight: machine had rebooted (daemon down). Started Docker
    Desktop, polled ≤180s, containers started. `docker ps` showed orphan
    `infra`-project containers still on `0.0.0.0` binds.
  - Dispatch 1 (@fixer, F1/F3 exact scope) — HARNESS FAILED ("Failed to
    execute statement"), zero evidence.
  - Dispatch 2 (@build, same brief) — SUCCEEDED. Report: both files already
    in required end-state at its arrival; runtime remediation required
    (stopped orphan containers, copied volumes `infra_nourish_pg_data` →
    `api_nourish-pgdata` / `infra_nourish_redis_data` →
    `api_nourish-redisdata` with ro sources, removed orphan containers,
    `docker compose up -d` from apps/api). Report evidence: docker ps
    loopback-only; Food count 18; F3 build-stage `NO_ENV`; e2e 31/31; git
    status only the 2 intended files.
  - **Architect independent verification:** docker-compose.yml read —
    `127.0.0.1:5432:5432` / `127.0.0.1:6379:6379` ✓; `.dockerignore` read —
    6 patterns exactly ✓; docker ps loopback-only ✓; compose project label
    `api` → `apps/api/docker-compose.yml` ✓; Food count 18 ✓; `infra/` dir
    absent ✓.
  - **PROVENANCE NOTE (evidence-integrity, permanent):** architect's
    pre-dispatch read of docker-compose.yml showed wildcard binds; @build
    claimed both files were already fixed before it started; file mtimes
    (14:01:54–56) fall inside the @build run window. Either the failed
    @fixer dispatch wrote the files before its harness failure (making
    @build's claim true from its perspective), or @build misrepresented its
    own edits. Indistinguishable from timestamps; material end-state
    independently verified correct either way. Lesson: always verify
    on-disk state personally after agent claims.
  - Gate C dispatch attempt 1 — HARNESS FAILED ("Cannot connect to API" —
    subagent runtime connectivity), zero evidence. Attempt 2 — CANCELLED by
    user-initiated session save. Gate C remains ZERO-evidence; NOT gate
    retries (environment-level).
  - Docker state for next resume: containers compose-managed (project
    `api`); restart via `docker compose up -d` from `apps/api` (NOT
    `docker start`).
  - Git: unchanged — HEAD `56a6a6b`, ~40 uncommitted S1 paths + this
    STATE.md update. Nothing committed (Gate F still pending).

## Next Session - the one unbuilt piece: S3 pull (restore and reconciliation)

Push is built and live-verified (see the newest evidence block). What remains is
the other direction, researched against the server code so it does not have to
be re-derived:

- **What the server returns** (`apps/api/src/sync/sync.service.ts` `pull`):
  `GET /v1/sync/changes?since=<ISO>&limit=<1..500>` answers
  `{ meals: [...], water: [...], weight: [...], serverTime }`. Each row carries
  `clientId`, `dateKey`, `loggedAt`, `updatedAt`, `deletedAt` (a tombstone is a
  row with `deletedAt` set, not an absence) and, for meals, `clientSeq` and a
  nested `items[]` with each item's own `clientId` and its frozen snapshot.
  `serverTime` is the cursor to send back as `since` next time.
- **Why this needs care:** applying rows writes into the same tables the user is
  logging into. The server's rule is device-clock last-write-wins
  (`decideMerge` in `merge.ts`), so the device must apply the same rule locally
  or the two sides will disagree about which version is current. A pull must
  also ignore the rows this device just pushed (its own `clientId`s), or it will
  duplicate them.
- **Suggested order of work:** store the cursor (a `seed_meta` settings key) ->
  map remote rows to local rows by `clientId`, which needs a `clientId` column
  or index on each synced table since local ids are integers -> apply upserts and
  tombstones inside one transaction -> a merge test with a real two-way conflict
  (same `clientId`, device edit vs server edit, different `updatedAt`) -> then the
  restore-onto-a-fresh-install path, which is what makes the account screen's
  "this is a backup, not a sync" copy obsolete.
- The account screen's push-only copy is true today and must change in the same
  commit that starts pulling.

## What is not built, and what each one is waiting for

"The agent ran out of patience" and "this cannot be done in this environment" are
different problems, and a handoff that blurs them wastes the next person's time.
Every remaining item, with the thing that actually gates it:

| Item | State | Gated by |
| --- | --- | --- |
| **S3 apply/restore** (`GET /v1/sync/changes` → local tables) | Read half built, unit-tested and live-verified; **nothing writes remote rows back** | Nothing external — it is ordinary work: schema v6 adds a durable `clientId` to the three synced tables, then insert-time identity, tombstone-aware apply and a two-way merge test. Design notes are in *Next Session* above |
| **WW-02 water reminders** | Not built | Platform verification, not design: the behaviour needs scheduled local notifications, and this environment has no device to confirm they arrive (or that they stay silent when the target is met). Building the settings UI without that would ship a screen that does nothing |
| **SUB-01 entitlements / paywall** | Not built | Two external inputs: no design exists (P-SUB-1) and no payment provider is configured (P-PROV-1). The server-side plan/consent model already exists and is reported on the account screen |
| **UAT** | Not run | A human. `docs/uat-checklist.md` is ready; no check in it has been executed by an agent |
| **Merge and release** | Not done, correctly | The same UAT approval (AGENTS.md §10). `master` is still at the S0 release commit |
| **Release pipeline** | Never run | A git remote and the secrets listed in `docs/release-process.md` (keystore, Play credentials). The workflows parse and their contracts are tested |
| **Real AI recognition** | Implemented, unit-tested against a mock only | An AI provider key. The provider seam refuses unknown configuration rather than falling back to a fake answer |
| **Real SMS delivery** | Implemented, exercised through the console gateway only | An SMS gateway credential. The `http` gateway is configuration rather than exercised code |

## UAT handoff (human approval required before merge)

`feat/nourish-mvp` holds everything; `master` still points at the S0 release
commit `1c16902`. Nothing has been merged, and per AGENTS.md §10 nothing will be
without explicit human UAT approval.

What a reviewer should look at, in order:

1. `README.md` — the front door: what is built, what is not, and the honest
   limits (no AI key, no SMS gateway, no store release).
2. `docs/uat-checklist.md` — the checks to walk, with expected results and the
   gaps labelled. Nothing there has been executed by an agent.
2. `apps/mobile` on a device or desktop: onboarding → log a meal (text and
   photo lanes) → Home dashboard → Insights → weight → water goal → "what can I
   eat" → Profile tab → sign in → back up (needs the API running with
   `SMS_PROVIDER=console`, or use the console code from the API log).
3. `docs/plans/provisional-product-assumptions.md` — every undesigned screen that
   was built provisionally (PPA-1…PPA-16). These are the product decisions
   awaiting sign-off; overturning one reworks only the listed slice.
4. `docs/swarm/STATE.md` — this file: gates, evidence, unresolved risks, and the
   *Next Session* block naming the one unbuilt piece (S3 pull/restore).

Known gaps at handoff: sync pushes but pulls nothing back (a backup, not a
restore), water reminders (WW-02), entitlements/paywall (SUB-01, needs a provider
and a design), and the release pipeline (never run — needs a remote and secrets).

## GraphSync Note

`graphify` command is not installed on this machine — recorded as a limitation
per AGENTS.md §9 (do not pretend it ran). Run `graphify update .` at Gate E if
it becomes available; otherwise continue recording the limitation.
