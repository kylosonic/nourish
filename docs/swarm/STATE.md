# Swarm Orchestration State

Authoritative workflow state for the Nourish engineering swarm.
Maintained by `@scribe`. A gate is never marked complete without the invoking
agent's exact approval.

## Current State

| Field | Value |
| --- | --- |
| Phase | `PLANNED (S0) — Gate B part 3 (UI) INCOMPLETE — SESSION CHECKPOINT saved` |
| Active branch | `feat/nourish-mvp` |
| Batch | Nourish MVP vertical slices S0–S5 |
| Active slice | S0 (Foundation + Onboarding + Manual Logging) |
| Active gate | Gate B (implement) — parts 1 & 2 DONE; part 3 `@designer` (design-system package + real screens) was ABORTED by the user before producing output |
| Retry count | 1 (implementation retry used: first `@build` core task returned empty/no files → retried with reduced scope, succeeded. Designer abort is NOT a retry — task must be re-dispatched fresh) |

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

### Active

- **Gate B (implement)** for slice S0 — parts 1 and 2 COMPLETE (evidence in
  `## Last Verification Evidence`). Part 3 (`@designer`: design-system package +
  real screens replacing stubs) was dispatched and **aborted by the user**; no
  designer output was produced (verified: all 16 feature files still carry
  `// STUB` markers; `packages/design-system` is still the placeholder). See
  `## Resume Instructions`.

### Failed

- **Gate B part 1, attempt 1** — `@build` task returned an empty result and
  created zero files (subagent execution failure). Recovered per protocol:
  retried with reduced, checkpointed scope; succeeded (27/27 domain tests).
- None other.

## Resume Instructions (next session — follow in order)

1. **Do not re-run anything already done.** Verified-on-disk state: git has a
   single commit `25e27c8` (baseline); everything since is untracked on
   `feat/nourish-mvp` — `CONTEXT.md`, `docs/`, `packages/`, `apps/`. Nothing
   has been committed because Gate F has not been reached (per commit policy).
2. **Quick sanity check** (optional): `flutter analyze` + `flutter test` in
   `apps/mobile` and `packages/domain` to reconfirm part-1/2 state
   (was: domain 27/27 green, mobile 50/50 green, analyzers clean).
3. **Re-dispatch Gate B part 3** — `@designer` task with the same brief as
   recorded in this session: replace `packages/design-system` placeholder with
   the full token/theme/widget package per `Design/nourish/DESIGN.md`; replace
   all 16 stub screens with real Stitch-faithful implementations per
   `docs/plans/slice-s0-blueprint.md` §10/§16 and behavior files
   `docs/behaviors/onboarding.md`, `home-dashboard.md`, `logging-methods.md`,
   `scan-analysis.md`; bundle Inter + Noto Sans Ethiopic fonts; zero runtime
   network; extend `apps/mobile/test/widget/`; keep existing tests green.
4. **Gate C (QA)** — dispatch `@qa` from the architect level with the
   acceptance matrix in blueprint §16.
5. **Gate D (security)** — record `SECURITY NOT REQUIRED` for S0 per
   execution-contract rationale (zero network egress, no secrets, no remote
   code; local-only sensitive data, at-rest encryption deferred to S3 and
   accepted as documented provisional risk) — re-open immediately if any
   runtime network call or secret appears.
6. **Gate E (integration)** — architect verifies: analyze clean, all tests
   green, no TODO/stub markers remaining in shipped paths (honest-void lanes
   are intentional), zero-egress grep clean, `graphify update .` if available
   (if still unavailable, record limitation).
7. **Gate F (commit)** — single atomic commit of S0 implementation on
   `feat/nourish-mvp` (after gates C–E). Then update STATE phase to
   `IMPLEMENTING (S1)` / plan S1 blueprint (Gate A for S1).
8. **UAT checkpoint** — present the S0 build to the human for hands-on review
   before any merge; also surface `docs/plans/provisional-product-assumptions.md`
   (PPA-1..8) for sign-off since several assumptions ship in S0.

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
- **Gate B part 3 (UI)** — NOT STARTED (designer task aborted by user; verified
  no output: 16/16 feature files still stubs, design-system still placeholder).
- Gates C (QA), D (security record), E (integration), F (commit): pending.
- Environment checks:
  - Flutter 3.44.8 (stable)
  - Node v24.16.0
  - npm 11.13.0
  - git 2.55.0.windows.5

## GraphSync Note

`graphify` command is not installed on this machine — recorded as a limitation
per AGENTS.md §9 (do not pretend it ran). Run `graphify update .` at Gate E if
it becomes available; otherwise continue recording the limitation.
