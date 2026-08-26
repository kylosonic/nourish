# ADR-0002: Vertical Slice Delivery Plan (S0–S5)

- **Status:** Accepted
- **Date:** 2026-08-26
- **Deciders:** @architect (derived from master prompt §69–§70 and the
  behavior contracts in `docs/behaviors/`)

## Context

The master prompt §69 defines a first production candidate (auth, onboarding,
daily target, home, photo scanner, Ethiopian food recognition, nutrition
calculation, manual correction, history, weight, water, basic insights,
Android release, website, download infrastructure). Building it as one
undifferentiated blob is high-risk; the swarm needs small, reversible,
individually verifiable increments (AGENTS.md §1).

## Decision

Deliver the MVP as six vertical slices. Each slice is a usable, testable
increment with its own gates, in strict order:

- **S0 — Foundation + Onboarding + Home + Manual Logging.** Fully local,
  offline-capable. Bundled provisional food seed catalog labeled
  non-authoritative. No network egress.
- **S1 — Backend + Canonical Food API.** NestJS + Postgres + Prisma + Redis.
  Ethiopian Food Composition Table 2025 import with provenance fields
  (`source_name`, `source_version`, `source_food_code`, `source_reference`,
  `import_date`). Food search API. The mobile catalog migrates from the S0
  seed to API-with-offline-cache.
- **S2 — Photo Scan AI Loop.** Validated-JSON AI pipeline stages: vision →
  retrieval → normalization → portion → nutrition → confidence. Analysis /
  result / low-confidence screens. Corrections capture (SAFE-07).
- **S3 — Auth + Accounts + Sync.** Phone `+251` OTP sign-in, token rotation,
  server-side meals, offline queue sync (OFF-02).
- **S4 — Water/Weight + Insights + Recommendations.**
- **S5 — Website + Release Infrastructure.** Marketing site with dynamic
  download UX, `latest.json`, GitHub Actions release pipeline, R2 upload,
  in-app update check.

**Deferred beyond MVP:** admin app (except the corrections review queue,
SAFE-07), recipes, saved meals, localization content for Amharic/Afaan Oromo,
social/family/coach features. The architecture must not block these; they are
simply not implemented in this batch.

## Alternatives Considered

- **Horizontal layers (all models, then all services, then all UI):**
  rejected — no user-visible value until the very end, and integration risk
  is back-loaded.
- **AI-loop first (scan before manual logging):** rejected — depends on the
  backend and AI pipeline; would delay the first usable release.
- **Big-bang single slice:** rejected — unreviewable change surface,
  violates the swarm's small-reversible-changes rule.

## Consequences

- **S0 delivers real user value (log food, see nutrition) before any backend
  exists.** Users can onboard and log meals offline from day one.
- Each slice has a natural security/QA boundary (S0 has no network egress;
  S1 onward requires the security gate).
- Provisional product items (see `docs/plans/provisional-product-assumptions.md`)
  are isolated to the slices they affect, so a late answer reworks one slice,
  not the whole batch.
- Slice order is a dependency chain: S2 needs S1's food API; S3 needs S1's
  backend; S4 needs S3's server-side data; S5 needs a shippable app.

## Migration / Rollback

Per-slice: rollback = revert the slice's commits on `feat/nourish-mvp`.
Nothing merges to `main` without UAT (AGENTS.md §10).
