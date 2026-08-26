# ADR-0004: Data Semantics (Snapshots, Nulls, Food Layer, Confidence, Seeds)

- **Status:** Accepted (items (d) PROVISIONAL)
- **Date:** 2026-08-26
- **Deciders:** @architect (from behavior contracts TGT-04, TGT-05, INS-01,
  SCAN-06 and pending items P-INS-1, P-SCAN-2)

## Context

Several behavior contracts carry data-model consequences that must be decided
before S0 models are written: historical immutability, the difference between
"nothing logged" and "logged zero", the canonical food layer shape,
confidence thresholds, and the trust status of the S0 seed catalog.

## Decision

**(a) Nutrition snapshots make history immutable (TGT-04).** Every saved meal
item stores the nutrition values used at logging time. Later food-database
changes never alter what a historical meal shows or contributes. Editing a
historical meal creates a new snapshot for the edited items.

**(b) Un-logged vs. logged-zero days (resolves P-INS-1).** A day with no meal
entries at all is stored as **NULL** (no aggregation record); charts render a
**gap** for it. A day where the user explicitly logged and the total is zero
is stored as **0**; charts render a **zero bar**. This distinction is a
data-model guarantee — the UI renders whatever the model says, and no
aggregation code may conflate the two.

**(c) Canonical food layer (TGT-05).** Every food reference (search, AI
output, logging) resolves through one canonical food record holding names,
aliases, transliterations, common misspellings (English and Amharic), and
provenance fields (`source_name`, `source_version`, `source_food_code`,
`source_reference`, `import_date`). Authoritative nutrition comes from the
Ethiopian Food Composition Table 2025 where available; values are never
fabricated when source data exists.

**(d) Confidence thresholds — PROVISIONAL.** Overall and per-item confidence
maps to states as:

| State | Threshold |
| --- | --- |
| High | ≥ 0.85 |
| Medium | 0.60 – 0.84 |
| Low | < 0.60 |

Awaiting product confirmation (P-SCAN-2). Until confirmed, these are the
implementation values and the low-confidence flow routes on the **overall**
score while per-item scores drive per-item UI treatment.

**(e) Seed catalog trust labeling.** All food records bundled in S0 carry
`source: "provisional-seed"` and are **never presented to users as
authoritative**. The Ethiopian FCT 2025 import in S1 supersedes them
record-by-record, preserving provenance per (c).

## Alternatives Considered

- **Zero-fill for un-logged days:** rejected — presents fabricated data as
  fact, violating INS-01 and the no-fake-data rule.
- **Recompute history from the live food DB:** rejected — breaks TGT-04
  immutability and would silently rewrite user history.
- **Hardcode thresholds without product input:** rejected — thresholds are a
  product decision; ADR marks them provisional and routes through the
  sign-off list (PPA-4).

## Consequences

- Aggregation and chart layers must distinguish NULL from 0 end-to-end
  (SQL, API DTOs, chart data).
- Seed catalog records are trivially distinguishable from authoritative
  imports by their `source` field, so S1's import is a supersede operation,
  not a risky merge.
- The AI pipeline can hardcode the provisional thresholds in one config
  constant, replaced when product confirms.

## Migration / Rollback

Threshold changes (d) are a one-line config change. NULL-vs-0 semantics (b)
are baked into the schema from S0; changing them later would require an
aggregation migration, hence this ADR decides it now.
