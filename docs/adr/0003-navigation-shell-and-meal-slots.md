# ADR-0003: Navigation Shell and Meal Slots

- **Status:** PROVISIONAL — awaiting product confirmation
- **Date:** 2026-08-26
- **Deciders:** @architect, pending @vision/@product sign-off
- **Related pending items:** `docs/behaviors/pending-behaviors.md` P-HOME-1,
  P-HOME-2

## Context

Two different bottom-navigation shells exist in the Stitch design set:

- Home/Insights/Low-confidence screens show: **Home, Progress, Scan (center),
  Insights, Profile** (`home_screen`).
- The meal history screen shows: **Log, Insights, Kitchen, Profile**
  (`meal_history_log`).

The meal slot set is also inconsistent: Home shows Breakfast / Lunch / Dinner
with a dashed third slot, while meal history shows Breakfast / Lunch / Snack
entries. The master prompt names no fixed slot list.

## Decision

- The canonical app shell is **Home / Progress / Scan / Insights / Profile**
  (from `home_screen`, per HOME-05's assumption).
- The meal_history shell (**Log / Insights / Kitchen / Profile**) is
  **deprecated** in favor of the canonical shell.
- The canonical meal slot set is **Breakfast / Lunch / Dinner / Snack /
  Other** (the "Other" slot covers anything outside the named four).

## Alternatives Considered

- **Two-shell coexistence:** rejected — two navigation models in one app
  violates consistency and doubles routing work.
- **Meal-history shell as canonical:** rejected — the five-tab shell appears
  in more screens and contains the signature Scan action; HOME-05 already
  assumes it.
- **Three-slot-only set (Home's visible slots):** rejected — meal history
  already shows Snack entries; a fourth/fifth slot is required to model them.

## Consequences

- GoRouter top-level destinations are fixed early: Home, Progress, Scan,
  Insights, Profile. Progress has no shipped screen yet (P-HOME-3) and must
  follow the honest-voids pattern (ADR-0005).
- The meal data model uses the five-slot enum from S0; reworking the set
  later (e.g., adding "Mid-morning") would be a schema migration, so the
  enum is versioned in the data layer.
- Until product confirmation, this ADR is flagged PROVISIONAL; the state file
  tracks it as PPA-5.

## Migration / Rollback

If product confirms a different shell or slot set, only the routing table and
meal slot enum change — per-slice reversal is cheap because S0 is the only
consumer so far. Decision does not take effect as permanent until sign-off.
