# Provisional Product Assumptions (awaiting human sign-off)

Every assumption below is **provisional**. It unblocks implementation but
must receive explicit human/product sign-off before the affected slice's
work is considered final. Overturning an assumption reworks only the listed
slice(s). Tracked in `docs/swarm/STATE.md` under unresolved risks.

| ID | Assumption | Origin | Rework if overturned |
| --- | --- | --- | --- |
| PPA-1 | Onboarding sequence is Welcome → Language → Goal → Body → Activity → Pace → Food pref → Daily target. | P-ONB-2 (step counters disagree across Stitch screens) | S0 onboarding flow and progress math |
| PPA-2 | The pace step is shown only for the "Lose weight" goal; other goals skip directly to food preference. | P-ONB-1 (pace options are loss-oriented) | S0 onboarding branching; S0 target engine inputs |
| PPA-3 | Minimum age 18; safe calorie floor 1200 kcal (female) / 1500 kcal (male); body input ranges age 18–100, height 100–250 cm, weight 30–350 kg. | P-SAFETY-1 (safety thresholds must come from professional input) | S0 onboarding validation; S0/S1 safety config — all values replaced by professional-input config |
| PPA-4 | Confidence thresholds: overall and per-item High ≥ 0.85, Medium 0.60–0.84, Low < 0.60 (ADR-0004). | P-SCAN-2 (thresholds undefined in design/prompt) | S2 AI pipeline routing and result/low-confidence screens |
| PPA-5 | Canonical nav shell is Home/Progress/Scan/Insights/Profile; meal slots are Breakfast/Lunch/Dinner/Snack/Other; the meal-history shell (Log/Insights/Kitchen/Profile) is deprecated (ADR-0003). | P-HOME-1, P-HOME-2 (two shells, inconsistent slots across screens) | S0 navigation architecture and meal data model |
| PPA-6 | Language selection persists in S0, but UI strings ship in English only; Amharic/Afaan Oromo content is roadmap (master §70). | Master §70; language step exists in onboarding design | S0 localization plumbing; later localization content slices |
| PPA-7 | Meal slots "Snack" and "Other" exist even though the home design shows three slots. | P-HOME-1 (history shows Snack entries) | S0 meal model and home "Today's Meals" rendering |
| PPA-8 | S0 seed catalog values are provisional placeholders; they are never presented as authoritative and are superseded record-by-record by the Ethiopian FCT 2025 import in S1. | ADR-0004(e); no backend exists in S0 | S1 import/supersede strategy only (no rework if honored) |
| PPA-13 | The WW-03 weight screen is built from the behaviour contract's own contents (current weight, target weight, history, weekly/monthly trend, non-alarming noise copy) using the existing card/heading system; its layout is provisional until P-WW-2 is designed. Its INS-02 weight highlight is stated as a fact (`informational`), never as praise or a warning, because whether a move is good depends on the user's goal. | P-WW-2 (dedicated water/weight screens not designed); INS-02 lists "weight trend" as a highlight source | The weight screen layout and the weight highlight's presentation |

## Sign-off procedure

1. Product/vision reviews each row and records **Approved** or **Revised**
   here (with the new value in the "Assumption" column).
2. `@scribe` updates `docs/swarm/STATE.md` to remove signed-off items from
   the unresolved-risk list and records any slice rework.
3. An overturned assumption whose slice has already shipped triggers a
   corrective ticket on that slice's branch before the batch merges.
