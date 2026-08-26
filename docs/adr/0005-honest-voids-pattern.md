# ADR-0005: Honest Voids Pattern (No Dead Buttons in Incremental Slices)

- **Status:** Accepted
- **Date:** 2026-08-26
- **Deciders:** @architect

## Context

The master prompt §71 forbids fake functionality and dead buttons. But the
vertical-slice plan (ADR-0002) ships in increments: in S0, features that are
designed but not yet implemented (photo scan, voice, barcode, Progress tab,
insights, etc.) exist in the navigation and menus. A strict reading of §71
would forbid any visible entry point to a not-yet-built lane, while removing
those entry points would distort the approved Stitch design.

## Decision

For the first slice (and any slice while lanes are still missing), features
that are designed but not yet implemented must never be dead buttons or fake
functionality. The **Honest Voids Pattern** applies:

1. **Every entry point whose feature lane is not yet built routes to a real
   screen** — never a no-op, never a fake result.
2. That screen (1) **states the feature is not available in this build**, and
   (2) **offers the working alternative path** where one exists (e.g., manual
   logging / food search for the scan lane; food search for voice/barcode).
3. **Empty data states are honest.** Example: "Nothing logged yet — tap Scan
   to log your first meal" — never a zero-filled fake dashboard, never a
   spinner that never resolves.

This pattern is **temporary per slice**: as each lane ships, its honest-void
screen is deleted and the real screen takes the route. A void screen must
never remain for a lane whose slice has shipped.

## Alternatives Considered

- **Hide all unimplemented entry points:** rejected — the scan menu and nav
  shell come from the approved design; hiding them rewrites the product
  before its first slice.
- **Stub screens with fake data:** rejected — violates §71 (no fake
  functionality) and §16's truthfulness rules.
- **Dead buttons:** rejected — the exact failure §71 names.

## Consequences

- Users in S0 always get either a working path or the truth; nothing lies.
- The pattern gives QA a precise acceptance criterion per slice: "no entry
  point silently dead; each void screen names the missing feature and the
  alternative."
- Work is bounded: the honest-void screens are throwaway and are tracked per
  slice so none survive past their lane's release.

## Migration / Rollback

Void screens are removed in the slice that builds their lane (S1/S2 for scan,
S4 for insights/progress surfaces). No schema impact. If a lane slips, its
void screen may remain for one extra slice with @architect approval recorded
in STATE.md.
