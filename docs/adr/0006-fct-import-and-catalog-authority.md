# ADR-0006: FCT Import Pipeline and Catalog Data Authority

- **Status:** Accepted
- **Date:** 2026-08-26
- **Deciders:** @architect, with @plan (S1 Gate A review)
- **Related:** ADR-0004 (data semantics, provenance, seed trust labeling), ADR-0001 (stack),
  ADR-0002 (S1 scope)

## Context

Slice S1 (ADR-0002) introduces the backend and the canonical food layer. The Ethiopian Food
Composition Table 2025 (EPHI & FAO) is the primary authoritative nutrition source (master §10,
TGT-05). S1 must import it with full provenance, and the mobile catalog must migrate from the
S0 provisional seed (ADR-0004(e), PPA-8) to API-with-offline-cache (OFF-01). Three questions
required decisions before implementation: how the dataset is acquired and what enters the
repository (D1), what authority applies to portion gram weights (D3), and what happens if full
extraction slips (D5). Decisions D2 (no queue code in S1) and D4 (Sentry API-only) were
resolved in the same review but are S1 execution-scope items recorded in the S1 blueprint and
STATE.md, not architecture subjects of this ADR.

## Decision

**(D1) Dataset acquisition and repository content.** The FCT 2025 PDF is publicly published by
EPHI & FAO. The swarm acquires it, records the acquisition URL, download date, and sha256, and
commits a derived staged JSONL extract plus a ~20-food verified fixture subset under
`apps/api/prisma/fixtures/`, with full citation and provenance in
`prisma/fixtures/README.md`. The PDF itself is never committed. The README states the
publication's attribution factually (EPHI & FAO 2025, "The Ethiopian Food Composition Table
2025. Addis Ababa, Ethiopia."). If the publication's license is not determinable, the README
states "license not stated on source — attribution preserved"; a license is never invented.

**(D3) Nutrition authority vs portion standards.** The FCT supplies per-100g nutrition values;
those carry FCT provenance (ADR-0004(c)) and are never fabricated. Portion gram weights (e.g.,
"1 cup = 240 g") are NOT FCT data — they are Nourish-defined standard measures, stored with
`portion_source: "nourish-standard"`, and never presented as FCT-authoritative. The portion
engine (TGT-02) consumes these; the honesty rule (never present non-authoritative values as
authoritative) is preserved end-to-end.

**(D5) Fallback shipping criterion.** If full PDF extraction proves unreliable in-slice, S1 may
ship on the verified fixture subset ONLY IF: (a) the subset is double-entry-verified with
page/food-code citations; (b) full extraction is recorded as an OPEN TRACKED BLOCKER owned by
@architect/@researcher in `docs/swarm/STATE.md`; and (c) every UAT/release artifact explicitly
states data coverage ("20 of N foods"). The subset must never be presented as the full FCT 2025
catalog. The import pipeline and schema are identical in either path, so completing extraction
later is a data operation, not a re-architecture.

## Consequences

- Repository history contains a citable, checksummed, reproducible extract; provenance is
  verifiable without the PDF.
- Nutrition authority and portion authority are separable and labeled independently — a
  data-model guarantee, like ADR-0004's NULL-vs-0 rule.
- A fallback ship path exists that does not violate master §71 (no fake functionality) or the
  honesty rule, because coverage is stated, never implied.
- Re-import upgrades (FCT 2026+, full extract landing later) reuse the same version-gated,
  supersede-in-place pipeline; stable food ids preserve history and future S2 corrections
  capture (SAFE-07).

## Migration / Rollback

Extraction completion later is a new ImportRun over the same schema. Reverting S1 reverts the
slice commits (ADR-0002); the committed fixture data is inert without the import pipeline.
