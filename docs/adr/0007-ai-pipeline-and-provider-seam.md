# ADR-0007: AI Pipeline, Provider Seam, and Analysis Data Authority

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** @architect (S2 Gate A)
- **Related:** ADR-0002 (slices), ADR-0004 (data semantics, NULL-vs-0),
  ADR-0005 (honest voids), ADR-0006 (food data authority),
  `docs/behaviors/scan-analysis.md`, `docs/behaviors/safety-privacy-consent.md`,
  `docs/plans/slice-s2-blueprint.md`

## Context

S2 delivers the signature loop (photo → identify → portion → nutrition →
confirm → save). It is the first slice where a non-deterministic component (a
vision/LLM provider) sits inside a product decision path, and the first slice
that accepts user-submitted bytes. Master §13/§15/§16/§71 require that the AI is
never the final calculator, that all AI output is schema-validated, and that no
part of the product fakes functionality. Master §27/SAFE-05 require that food
imagery is not retained indefinitely and that metadata is stripped.

Two environment facts shaped the decision: no AI provider credential exists in
the development environment, and no Stitch design exists for the edit-before-save
or text-logging screens (P-SCAN-1, P-LOG-1).

## Decision

1. **Provider seam.** All model access goes through `VisionProvider` /
   `TextProvider` interfaces selected by a factory from environment
   configuration. Exactly three implementations exist: a real
   OpenAI-compatible HTTP provider, a `NullProvider` that fails honestly with
   `503 AI_UNAVAILABLE`, and a deterministic `FixtureProvider` that the factory
   refuses to construct when `NODE_ENV=production`. There is no code path in
   which production returns canned analysis data.

2. **The AI proposes; deterministic code decides.** The model may return only:
   candidate food names/labels, a rough portion (amount + unit, optionally
   grams), and per-item confidence. Portion gram weights come from the food
   layer (`portion_source: nourish-standard`, ADR-0006/D3); nutrition is
   computed as `per100g × grams / 100` from stored FCT values with
   half-away-from-zero rounding. Calories, macros and targets are never taken
   from model output.

3. **Validation at the boundary.** AI payloads are parsed into DTOs and
   validated with the project's single validation stack (class-validator +
   class-transformer, whitelist, forbidNonWhitelisted). A violation fails the
   run with `AI_INVALID_OUTPUT` (502). Partial or malformed output is never
   surfaced, and nothing is persisted as a result.

4. **No imagery persistence.** Uploaded bytes live in memory for the duration
   of one request. The API never writes them to disk and the schema has no
   image column. SAFE-05's "not retained indefinitely" is satisfied by
   retaining nothing; retention configuration (`ANALYSIS_RETENTION_DAYS`) and a
   purge CLI apply to analysis *metadata* only.

5. **Anonymous analysis records.** Analysis runs, items, candidates and
   corrections carry no user identity in S2. `userId` exists as a nullable
   column reserved for S3 account linking and is null in S2. Correction records
   hold structural learning data only (prediction, choice, portion, model and
   prompt version, timestamp) — no identity, no free text, no imagery — which
   keeps SAFE-06's default-off training rule intact: no user data enters a
   model-improvement pipeline.

6. **Unresolved is a first-class outcome.** A candidate the food layer cannot
   resolve becomes an item with `foodId: null`, `nutrition: null`,
   `unresolved: true`, and can neither be silently estimated nor saved until
   the user resolves or removes it (ADR-0004's NULL-vs-0 rule extended to
   analysis output).

7. **Undesigned screens are built to the behavior contract.** SCAN-07 and
   LOG-01 have no Stitch screen. They are implemented from the design system
   plus the behavior contracts' stated minimum contents, and recorded as
   provisional product assumptions (PPA-10, PPA-11) requiring human sign-off —
   the ADR-0005 pattern (never a dead button, never a silent redesign).

8. **Cost and abuse are operability requirements.** A separate throttler bucket
   and a process-wide daily budget guard protect the anonymous analysis
   endpoint; both fail closed with explicit error codes.

## Alternatives Considered

- **A single large LLM prompt producing the whole result including nutrition.**
  Rejected: violates master §13/§15 and makes nutrition non-reproducible and
  unauditable.
- **Trusting the provider's grams directly.** Rejected: grams are the input to
  the nutrition calculation; they come from the food layer's portion table, and
  a provider value is only a fallback that is explicitly flagged as estimated.
- **Storing uploaded images for debugging.** Rejected for S2: it converts a
  sensitive-data liability into a default. Debugging uses structural run
  metadata.
- **Shipping with a bundled fake provider so the flow always "works".**
  Rejected: it is exactly the "fake functionality" master §71 forbids. A clear
  503 plus the honest failure UI is the correct behaviour when no provider is
  configured.
- **Blocking S2 until a provider key and the missing designs exist.** Rejected:
  the pipeline, contract, validation, and screens are independently valuable
  and testable; the missing pieces are recorded as tracked blockers rather than
  silently simulated.

## Consequences

- Recognition quality cannot be claimed in this environment; the coverage
  statement at UAT will say the live provider path is implemented and unit-
  tested against a mock server but not exercised against a real model.
- The provider seam means adding or swapping a model is a configuration change
  plus one adapter.
- Because no image is retained, any future "show me the original photo"
  feature requires a new, consent-gated storage decision (S3+).
- Analysis rows accumulate without identity; the purge CLI is the documented
  operational control.

## Migration / Rollback

Additive Prisma migration (`analysis_layer`); reverse path is dropping the four
analysis tables, which holds no data referenced by shipped behavior. Rolling
back the slice is reverting its single commit (ADR-0002). Mobile rollback: the
scan menu lanes return to honest voids without touching local meal data.
Nothing merges to `main` without UAT.
