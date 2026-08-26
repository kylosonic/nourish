# Execution Contract — Nourish MVP (Slices S0–S5)

Binding execution agreement for the MVP batch on branch `feat/nourish-mvp`.
Authority: `@architect`. Recorded by `@scribe`. Any change to this contract
requires an ADR or explicit @architect amendment.

## Objective

Ship the **first production candidate** per master prompt §69:

Authentication · Onboarding · Daily target · Home · Photo scanner ·
Ethiopian food recognition · Nutrition calculation · Manual correction ·
History · Weight · Water · Basic insights · Android release · Website ·
Download infrastructure.

Delivered as vertical slices S0–S5 per ADR-0002. Each slice must be a
usable, testable increment, verified by gates before commit.

## Scope / Non-scope

**In scope (by slice):** per ADR-0002:

- S0 Foundation + Onboarding + Home + Manual Logging (fully local,
  offline-capable, provisional seed catalog).
- S1 Backend + Canonical Food API (NestJS + Postgres + Prisma + Redis,
  Ethiopian FCT 2025 import with provenance, food search API, mobile catalog
  migrates to API-with-offline-cache).
- S2 Photo Scan AI Loop (validated-JSON pipeline: vision → retrieval →
  normalization → portion → nutrition → confidence; analysis/result/
  low-confidence screens; corrections capture).
- S3 Auth + Accounts + Sync (phone +251 OTP, token rotation, server-side
  meals, offline queue sync).
- S4 Water/Weight + Insights + Recommendations.
- S5 Website + Release Infrastructure (marketing site with dynamic download
  UX, latest.json, GitHub Actions release pipeline, R2 upload, in-app update
  check).

**Out of scope (descoped):** per ADR-0002 and `docs/behaviors/pending-behaviors.md`
§H:

- Google/Apple/email sign-in (AUTH-04)
- Saved meals, recipe builder
- Barcode/OCR beyond the fallback path
- Admin app features beyond the corrections review queue (SAFE-07)
- Amharic/Afaan Oromo UI localization beyond language selection persistence
- HealthKit / Health Connect
- Restaurant menus
- Family plans, coach accounts

The architecture must not block any descoped item, but implementation must
not include it.

## Affected Behaviors

| Slice | Behavior files | Key IDs |
| --- | --- | --- |
| S0 | onboarding, home-dashboard, logging-methods (manual), targets-nutrition, safety-privacy-consent (local parts), offline-sync (cached catalog) | ONB-01..09, HOME-01..05, LOG-05/06, TGT-01..04, SAFE-01 (local), OFF-01 (local) |
| S1 | targets-nutrition, logging-methods (search), safety-privacy-consent | TGT-05, LOG-05, SAFE-02 |
| S2 | scan-analysis, logging-methods (text), safety-privacy-consent | SCAN-01..07, LOG-01, SAFE-05/06/07 |
| S3 | auth-session, offline-sync, subscriptions-payments (entitlement core) | AUTH-01..03, OFF-01/02, SUB-01 (core) |
| S4 | water-weight, insights-recommendations, subscriptions-payments (plans) | WW-01..03, INS-01..03, SUB-01/02 |
| S5 | release-download-update | REL-01..04 |

## Ticket IDs

No issue tracker is configured for this repository. Use slice-based
placeholder IDs until one exists:

- `TECH-S0-*` — Foundation, onboarding, home, manual logging
- `TECH-S1-*` — Backend, food API, FCT import
- `TECH-S2-*` — AI pipeline, scan screens, corrections
- `TECH-S3-*` — Auth, accounts, sync
- `TECH-S4-*` — Water/weight, insights, recommendations
- `TECH-S5-*` — Website, release infrastructure

Ticket close rule (AGENTS.md): a ticket closes only when acceptance criteria
pass, the required security gate passes, integration verification passes, and
the implementation commit exists.

## Dependencies

- S0 depends on: behavior contracts (done), design set (done), ADRs 0001–0005.
- S1 depends on: S0 (seed catalog to supersede).
- S2 depends on: S1 (canonical food API).
- S3 depends on: S1 (backend) and S0/S1 mobile persistence.
- S4 depends on: S3 (server-side meals/history).
- S5 depends on: a shippable app (S0–S4) and master §33–§52.

## Risk Level

**HIGH.** Primary risks and mitigations:

- **Greenfield project** — no existing code or conventions. Mitigation:
  contract-driven slices, strict gates, small reversible commits.
- **AI pipeline correctness** (S2) — hallucination/fabrication risk.
  Mitigation: schema-validated JSON only; deterministic nutrition engine
  downstream; confidence thresholds (ADR-0004); corrections capture; the AI
  is never the final calculator.
- **Payments/entitlements late in the batch** (S3/S4) — server-authoritative
  entitlements are non-negotiable (SUB-01). Mitigation: entitlement model
  defined in S1 schema even though UI ships later.
- **Provisional product assumptions** — late answers could rework slices.
  Mitigation: assumptions isolated per slice (PPA list); honest-voids pattern
  keeps unfinished lanes truthful.

## Acceptance Criteria

Per-slice gates; **S0 must pass**:

- `flutter analyze` clean.
- `flutter test` green.
- Widget tests for onboarding, home, and manual logging.
- Manual verification list (checklist executed by QA):
  1. Fresh install → welcome → full onboarding → daily target screen shows
     engine-computed target.
  2. Home renders with zero logs; ring/Calories Left match target.
  3. Log a meal via food search from the seed catalog → totals update
     immediately.
  4. Every unimplemented entry point (scan menu items, Progress tab) shows an
     honest-void screen with the working alternative.
  5. Kill and reopen mid-onboarding → resumes at the first unanswered step.
  6. Airplane mode → manual logging and search-from-cache still work.

Later slices extend this list per their behaviors.

## Test Strategy

- Unit/widget tests first; **TDD for the deterministic engines** (portion
  engine, nutrition engine, calorie target engine) — they are pure functions
  and must be locked by tests before UI consumes them.
- Widget tests for every designed screen; golden tests where the design
  system permits.
- API/database tests from S1; AI schema validation tests from S2.
- E2E critical paths from master §56 (signup, onboarding, scan meal, edit
  meal, save meal, view dashboard, subscribe, payment verification, account
  deletion, data export) are added **as they become possible** per slice,
  not all at once.

## Security Sensitivity

**HIGH — health data.** Nutrition, body metrics, food imagery, and fitness
data are sensitive per SAFE-02 and must be encrypted in transit/at rest and
never shipped to third-party analytics.

- **Security gate is mandatory from S1 onward** for any network- or
  server-touching change (per AGENTS.md §5 order: implementation → tests →
  QA → security → integration → commit).
- **S0: record `SECURITY NOT REQUIRED`** — S0 has **no network egress** and
  stores only local profile data (onboarding answers, targets, meals) in the
  device's local database/secure storage. Rationale recorded here: no
  secrets, no network surface, no third-party code paths. **This exemption
  is voided the moment S0 adds any network call or secret.**

## Rollout / Rollback

- **Feature branch only.** All work lands on `feat/nourish-mvp`; `main` is
  never modified directly.
- **No merge without UAT.** Explicit human UAT approval is required before
  any merge to `main` (AGENTS.md §10).
- **Rollback = revert branch.** Per-slice rollback is reverting that slice's
  commits. No database migration runs without a documented reverse path.
