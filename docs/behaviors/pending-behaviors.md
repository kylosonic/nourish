# Pending Behaviors & Open Questions

Maintained by `@vision`. Everything here is **unresolved at behavior level**
and must be decided or explicitly descoped before the architect locks the
corresponding slice. Items are numbered `P-<AREA>-<n>` and referenced from the
behavior files.

## A. Design contradictions (must be resolved against the Stitch source)

### P-HOME-1 — Meal slot set is inconsistent across screens
Home shows Breakfast / Lunch / Dinner (with the dashed third slot). Meal
history shows Breakfast / Lunch / Snack entries. The master prompt references
a Meal History screen but no fixed slot list.
**Question:** is the slot set Breakfast/Lunch/Dinner/Snack (+ optional
"Other"), and does Home show all unfilled slots or just three?
**Impact:** Home layout, meal model, history rendering.

### P-HOME-2 — Two different bottom nav shells exist
Home/Insights/Low-confidence shells use: Home, Progress, Scan (center),
Insights, Profile. Meal history uses: Log, Insights, Kitchen, Profile.
**Question:** which shell is canonical? (Home's five-tab shell is assumed
canonical in HOME-05 until decided.)
**Impact:** navigation architecture.

### P-HOME-3 — Progress and Kitchen tabs have no shipped screen
The canonical shell exposes "Progress" and (per history shell) "Kitchen",
but no design exists for either.
**Question:** ship with these destinations hidden/stubbed-with-copy, or drop
them from the first release?
**Impact:** navigation scope for the first release.

## B. Onboarding ambiguities

### P-ONB-1 — Pace semantics for non-weight-loss goals
Preferred-pace options are expressed in kg/week losses (−0.25 / −0.5 / −1.0),
but goals include Build muscle, Maintain, Eat healthier.
**Question:** what do pace options show for non-loss goals (e.g., weekly gain
rates for muscle, or hide the step)?
**Impact:** target engine inputs, onboarding branching.

### P-ONB-2 — Onboarding step counters disagree
Labels observed: "STEP 1 OF 5", "Step 2 of 5", "Step 4 of 6", "1 OF 3",
and progress percentages 20% / 25% / 33% / 40% / 66%.
**Question:** what is the canonical sequence and step count? Recommended
candidate: Welcome → Language → Goal → Body → Activity → Pace → Food
preference → Daily target (8 steps, count labeled on-screen as 1 of 5 /
2 of 5 for the personalization cluster and 1 of 3 for preferences), but this
must be confirmed against the full Stitch flow.
**Impact:** onboarding UX, progress math.

## C. Scan / edit flow gaps

### P-SCAN-1 — Edit Meal screen not designed
SCAN-05/SCAN-07 reference an editing experience (ADJUST, EDIT) that has no
Stitch screen in this repository.
**Question:** confirm whether a design exists upstream; if not, the behavior
in SCAN-07 is the contract and the designer must produce it.
**Impact:** a core screen of the primary loop.

### P-SCAN-2 — Confidence thresholds undefined
High/Medium/Low states exist, but the numeric thresholds and whether
confidence is per-item, per-run, or both are not specified anywhere.
**Question:** propose thresholds + per-item behavior and get product sign-off.
**Impact:** AI pipeline, result vs. low-confidence routing.

### P-SCAN-3 — "AI CONFIDENCE HIGH (94%)" ADJUST vs. EDIT
The result screen has both an ADJUST control (next to confidence) and an EDIT
button. Their destinations are not designed.
**Question:** ADJUST = adjust per-item portions/identities; EDIT = same
editor? Or ADJUST = re-run confidence/portion adjustments?
**Impact:** result screen wiring.

## D. Logging gaps

### P-LOG-1..3 — Text logging, barcode, OCR screens not designed
Behaviors LOG-01/03/04 are defined from the master prompt; no visual design
exists.
**Impact:** these screens must be produced before their implementation.

### P-LOG-4 — Custom food creation not designed
Search-with-no-match leads to custom food creation conceptually, but neither
the screen nor the validation rules exist.
**Impact:** fallback path of food search.

### P-LOG-5 — Calendar picker not designed
Meal history shows a calendar icon; the full date picker is undesigned.
**Impact:** history navigation.

## E. Insights gaps

### P-INS-1 — Zero-consumption vs. un-logged days
Weekly charts must not present an un-logged day as a 0-calorie day. The
product has not stated how this is distinguished (chart gap, greyed bar,
excluded).
**Question:** visual + data-model treatment.
**Impact:** insights correctness.

### P-INS-2 — "What Can I Eat" screen not designed
INS-03 behavior defined from master prompt only.

## F. Subscriptions / settings / profile gaps

### P-SUB-1 — Paywall, Subscription, Profile, Settings, Privacy Center
All listed in Master §7 but absent from the design set.
**Question:** which of these are first-release scope? Master §69's first
release list omits subscriptions UI but includes weight/water.
**Impact:** release scope.

### P-SAFE-1 — Consent & Privacy Center screens not designed
SAFE-03/04/06 require consent UI, export, deletion, and the AI-improvement
toggle; none are designed.
**Impact:** legal-critical UI — must exist before production release.

### P-WW-1 / P-WW-2 — Dedicated water and weight screens not designed
Behaviors defined from master prompt; Home hydration card is the only
designed water surface.

## G. Product rules needing product sign-off (no design, no prompt detail)

- **P-AUTH-1** — Auth screens (phone entry, OTP entry) not designed.
- **P-FREE-1** — FREE plan feature boundaries: what is gated behind PLUS/PRO?
  The master prompt names plans but no feature matrix.
- **P-RET-1** — Food imagery retention window (SAFE-05): "not indefinitely"
  needs a concrete period.
- **P-SYNC-1** — Offline grace policy for premium features (SUB-01): how
  long do verified entitlements stay usable offline?
- **P-SAFETY-1** — Concrete safety thresholds: minimum age, safe calorie
  floor, extreme weight delta. Must be supplied as configuration values with
  professional input, not invented by engineering.
- **P-OTP-1** — OTP delivery provider and code length/TTL are not specified.
- **P-PROV-1** — Which payment providers ship in the first release? Master
  §32 lists candidates (Telebirr, CBE Birr, M-PESA, cards, bank transfer,
  App Store, Google Play) but no launch priority.

## H. Explicitly descoped for the first release (per Master §69–§70)

These are named in the master prompt but are NOT first-release behaviors;
the architecture must not block them, but implementation must not include
them: Google/Apple/email sign-in (AUTH-04), saved meals, recipe builder,
barcode/OCR beyond the fallback path, admin app features beyond the
correction-review queue (SAFE-07), Amharic/Afaan Oromo UI localization
beyond language selection persistence, HealthKit/Health Connect, restaurant
menus, family plans, coach accounts.

## I. Non-negotiable rules carried into every slice

1. Never present AI nutrition estimates as exact (the "~" affordance).
2. Never let the AI compute final nutrition, targets, or decide entitlements.
3. Never invent nutrition for packaged products or missing foods.
4. Never present an unsigned IPA as installable.
5. Never silently use user data for model training (consent-gated).
6. Nutrition snapshots make history immutable to database changes.
7. All AI output is schema-validated; malformed output is rejected.
