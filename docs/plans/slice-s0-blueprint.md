# Slice S0 Blueprint — Foundation + Onboarding + Home + Manual Logging

- **Status:** PLANNED (approved by @architect delegation to @plan)
- **Branch:** `feat/nourish-mvp`
- **Phase:** `ARCHITECTURE_LOCKED (S0)` → `PLANNED`
- **Slice:** S0 per ADR-0002 (Foundation + Onboarding + Home + Manual Logging)
- **Environment:** Flutter 3.44.8 stable / Dart 3.12.2 / Node v24.16.0 / git 2.55.0 (verified at baseline `25e27c8`)
- **Graphify note:** Graphify not available pre-scaffold (no source tree exists; see STATE.md GraphSync note). Run `graphify update .` after S0 implementation lands.

## 0. Provisional assumptions (PPA-1..8, as recorded in docs/swarm/STATE.md)

| Id | Assumption | Affects |
|----|-----------|---------|
| PPA-1 | Onboarding sequence: Welcome → Language → Goal → Body → Activity → Pace → Food pref → Daily target (resolves P-ONB-2) | §9 |
| PPA-2 | Pace step shown **only** when goal = Lose weight; other goals skip to Food preference (resolves P-ONB-1) | §4, §9 |
| PPA-3 | Min age 18; safe floors 1200 kcal (female) / 1500 kcal (male); ranges age 18–100, height 100–250 cm, weight 30–350 kg (resolves P-SAFETY-1; to be replaced by professional-input config) | §4, §8 |
| PPA-4 | Confidence thresholds per ADR-0004 (P-SCAN-2) | not in S0 (S2) |
| PPA-5 | Canonical 5-tab nav (Home/Progress/Scan/Insights/Profile) + meal slots Breakfast/Lunch/Dinner/Snack/Other per ADR-0003 (resolves P-HOME-1/2) | §6, §10 |
| PPA-6 | Language selection persists in S0; **all UI strings ship in English** (master §70) | §9 |
| PPA-7 | Slots "Snack" and "Other" exist in the model though the Home design shows three slots | §10 |
| PPA-8 | S0 seed catalog values are provisional placeholders (`source: provisional-seed`); superseded by Ethiopian FCT 2025 import in S1 (ADR-0004(e)) | §11 |

**Reference caveat recorded:** ADR-0003 (nav shell), ADR-0004 (data semantics, incl. (e) provisional seed), and ADR-0005 (honest voids) are referenced by CONTEXT.md / STATE.md but **not yet on disk** (only 0001, 0002 exist). This blueprint implements their described patterns; @architect should file them.

## 1. Goal
A runnable, fully-local Flutter app at `apps/mobile` (plus `packages/domain` and `packages/design-system`) delivering: complete offline onboarding (ONB-01..09), deterministic calorie-target engine (TGT-01), home dashboard with calorie ring/macros/meals/hydration (HOME-01..05), bundled seed food search (LOG-05), and manual logging with immutable nutrition snapshots + meal history (LOG-06, TGT-02..04). **Zero network egress.**

## 2. Scope and non-scope
**In scope:** monorepo scaffold (apps/mobile, packages/domain, packages/design-system only); onboarding flow; target engine; home shell + 4 honest-void tabs; scan menu sheet; food search + quick-add; manual meal logging; meal history; water quick-actions; Drift persistence; seed catalog import; tests; quality gates.

**Out of scope (S1+):** backend/API, auth/OTP, photo/voice/text AI lanes, barcode/OCR, portion/meal editing UI (SCAN-07), custom foods, insights content, subscriptions, i18n content, Sentry, image asset pipeline. All of it routes to the S0 honest-void screen.

## 3. TECH tickets
No ticket tracker is wired in the repo; tickets are behavior IDs + slice. This blueprint is the execution contract for slice S0 (ADR-0002). Behavior IDs covered: ONB-01..09, HOME-01..05, LOG-05, LOG-06, TGT-01..04, OFF-01 (local subset), WW-01 (hydration subset), SCAN-01 (menu routing subset).

## 4. Acceptance criteria (each with verification method)
See §16 acceptance test list — every criterion maps to a behavior ID and an automated test (unit or widget) or an analyzer gate. No acceptance criterion exists without a verification method.

## 5. Dependency graph
```
packages/domain        (pure Dart, ZERO deps — unit-testable without Flutter)
       ↑ path:../../packages/domain
packages/design-system (Flutter SDK only; bundles Inter + Noto Sans Ethiopic assets)
       ↑ path:../../packages/design-system
apps/mobile            (flutter_riverpod, go_router, drift, drift_flutter,
                        sqlite3_flutter_libs, path_provider, path, intl)
```
No cycles: app → {design-system, domain}; design-system → (Flutter only); domain → (nothing). **Self-check passed:** no circular dependency possible.

## 6. Exact file tree

### `packages/domain/` (pure Dart, `flutter create --template=package`)
```
pubspec.yaml                        — package name nourish_domain; zero runtime deps; SDK ^3.12.0
analysis_options.yaml               — strict lints
lib/domain.dart                     — barrel export
lib/src/models/goal.dart            — enum Goal {loseWeight, buildMuscle, maintainWeight, eatHealthier}
lib/src/models/activity.dart        — enum Activity {sedentary 1.2, light 1.375, moderate 1.55, veryActive 1.725, athlete 1.9}
lib/src/models/pace.dart            — enum Pace {conservative(-0.25,-250), moderate(-0.5,-500), aggressive(-1.0,-1000)} + kcalPerDay helper
lib/src/models/language.dart        — enum AppLanguage {en, am, om}
lib/src/models/food_preference.dart — enum FoodPreference {ethiopian, mixed, international}
lib/src/models/sex.dart             — enum Sex {female, male}
lib/src/models/meal_slot.dart       — enum MealSlot {breakfast, lunch, dinner, snack, other} + displayName
lib/src/models/portion_unit.dart    — enum PortionUnit (grams, milliliters, piece, cup, bowl, plate, halfPlate, glass, spoon, ladle, serving, halfInjera, injera, largeInjera)
lib/src/models/nutrition.dart       — NutritionPer100g + NutritionSnapshot (final fields; const ctor)
lib/src/models/food.dart            — Food: id, canonicalName, category, defaultPortion, portions list, per100g, aliases, sourceId, isSeed
lib/src/models/food_alias.dart      — FoodAlias: alias, language
lib/src/models/portion.dart         — Portion: unit, grams, label()
lib/src/models/food_source.dart     — FoodSource provenance: name, version, foodCode?, reference?, importDate
lib/src/models/user_profile.dart    — UserProfile: language, goal, sex, age, heightCm, currentWeightKg, targetWeightKg, activity, pace?, foodPreference, onboardingComplete, currentOnboardingStep
lib/src/models/daily_target.dart    — DailyTarget: targetKcal, proteinG, carbsG, fatG, bmrKcal, tdeeKcal, goalAdjustmentKcal, activityFactor, pace?, formulaVersion, dateGenerated, floorKcal
lib/src/models/meal.dart            — Meal: id, dateKey(yyyy-MM-dd), slot, createdAt; items; totals getter (sums snapshots)
lib/src/models/meal_item.dart       — MealItem: id, mealId, foodId, foodName, portionUnit, portionQuantity, grams, snapshot
lib/src/models/water_log.dart       — WaterLog: id, dateKey, amountMl, loggedAt
lib/src/engines/target_engine.dart  — TargetEngine.compute(input) → DailyTarget (spec §8); throws TargetEngineInputException on invalid input
lib/src/engines/portion_engine.dart — portionToGrams(food, unit, qty)
lib/src/engines/nutrition_engine.dart — nutritionFor(per100g, grams) → NutritionSnapshot
lib/src/engines/daily_totals.dart   — DailyTotals.fromMeals(meals) → consumed kcal/P/C/F
test/target_engine_test.dart
test/portion_engine_test.dart
test/nutrition_engine_test.dart
test/snapshot_immutability_test.dart
```

### `packages/design-system/` (Flutter package, `flutter create --template=package` + flutter dep added)
```
pubspec.yaml                           — name nourish_design_system; deps: flutter; assets: assets/fonts/
assets/fonts/Inter-Regular.ttf         — 400 (bundled, OFL)
assets/fonts/Inter-SemiBold.ttf        — 600
assets/fonts/Inter-Bold.ttf            — 700
assets/fonts/NotoSansEthiopic-VF.ttf   — Amharic glyph fallback (Inter lacks Ethiopic script; ONB-02 edge case)
lib/nourish_design_system.dart         — barrel
lib/src/tokens/colors.dart             — full DESIGN.md palette as consts (surface #fcf9f8, primary #006c49, primaryContainer #10b981, secondary #855300, secondaryContainer #fea619, tertiary #a43a3a, error #ba1a1a, on-*, outlines, surface-containers…)
lib/src/tokens/typography.dart         — NourishTextStyles: metric-xl 40/40 w700 -0.03em, headline-lg 32/40 w600, headline-lg-mobile 28/36 w600, headline-md 24/32 w600, body-lg 18/28 w400, body-md 16/24 w400, label-caps 12/16 w700 +0.05em, display-lg 48/56 w700
lib/src/tokens/spacing.dart            — base 8, gutter 16, containerMargin 24, sectionGap 40
lib/src/tokens/radii.dart              — button/input 12, cards/images 16–24, thumbnails 8, pill full
lib/src/tokens/elevation.dart          — level 0 (flat) / 1 (4px blur, 4% charcoal) / 2 (12px blur, 8%) per DESIGN.md
lib/src/theme/nourish_theme.dart       — buildNourishTheme(): ThemeData, fontFamily 'Inter' + fontFamilyFallback ['Noto Sans Ethiopic'], explicit ColorScheme from tokens, component themes
lib/src/widgets/nourish_button.dart    — primary (solid #006c49, r12), secondary (outlined), disabled state
lib/src/widgets/nourish_card.dart      — surface-container-lowest card, r16-24, elevation 1
lib/src/widgets/metric_card.dart       — metric-xl value + label-caps + thin circular progress
lib/src/widgets/progress_bar.dart      — 8px stroke, rounded cap, 5%-darker neutral track
lib/src/widgets/chip.dart              — nutritional chip (semi-transparent green/amber)
lib/src/widgets/nourish_input_field.dart — off-white, 1px outline, thickens on focus, error state + message
lib/src/widgets/radio_selector.dart    — selectable option card w/ radio indicator (language/pace/preference)
lib/src/widgets/segmented_selector.dart — sex segmented control
test/theme_smoke_test.dart             — theme builds; token values match DESIGN.md hex codes
test/widgets_smoke_test.dart           — each primitive renders without error
```

### `apps/mobile/` (`flutter create --org app.nourish --project-name nourish_mobile --platforms android,ios,windows`)
```
pubspec.yaml                    — name nourish_mobile; path deps to both packages; runtime deps per §7; dev: build_runner, drift_dev, flutter_lints
analysis_options.yaml           — flutter_lints + strictness
lib/main.dart                   — runApp(ProviderScope(child: NourishApp())); bootstrap: open Drift DB, first-run seed import
lib/app.dart                    — MaterialApp.router(theme: buildNourishTheme(), routerConfig)
lib/bootstrap/bootstrap.dart    — async init: AppDatabase.open, seed import (idempotent, seed_meta version gate), then route by onboarding state
lib/router/app_router.dart      — GoRouter with redirect logic (§10)
lib/router/routes.dart          — route path constants
lib/data/database.dart          — @DriftDatabase AppDatabase: all tables, DAOs
lib/data/tables/tables.dart     — Drift table defs: UserProfileRow, Foods, FoodAliases, FoodPortions, DailyTargets, Meals, MealItems, WaterLogs, SeedMeta
lib/data/daos/profile_dao.dart  — singleton profile row CRUD + onboarding step persistence
lib/data/daos/food_dao.dart     — catalog queries: search by alias (LIKE, case-insensitive), category filter
lib/data/daos/meal_dao.dart     — meals/items per date+slot; insert with snapshot; history by date
lib/data/daos/water_dao.dart    — water logs; sum ml by date
lib/data/daos/target_dao.dart   — insert DailyTarget; latest active target; historical preserved
lib/data/seed/seed_catalog.dart — the 20 provisional foods + aliases (incl. Amharic) + portions + per100g + source provisional-seed (§11)
lib/data/seed/seed_importer.dart — first-run import guarded by SeedMeta(version 's0-1')
lib/data/repositories/onboarding_repository.dart — persist/resume onboarding answers (ONB-09)
lib/data/repositories/food_repository.dart       — search, aliases→canonical, categories, portion table
lib/data/repositories/meal_repository.dart       — save meal+items w/ snapshots; totals per date; history
lib/data/repositories/water_repository.dart      — add/remove 250ml; daily total; floor at 0
lib/data/repositories/target_repository.dart     — derive (engine) + persist DailyTarget; re-derive on input change
lib/features/splash/splash_screen.dart           — minimal brand mark; resolves route (no dead spinner)
lib/features/welcome/welcome_screen.dart         — ONB-01 hero + GET STARTED + I ALREADY HAVE AN ACCOUNT → honest void (sign-in)
lib/features/onboarding/onboarding_flow.dart     — transactional wizard scaffold: progress header + bottom action bar; nav shell suppressed
lib/features/onboarding/onboarding_controller.dart — OnboardingController Notifier: step list per goal, draft answers, field validation, persist-on-continue, resume-at-first-unanswered
lib/features/onboarding/steps/language_step.dart        — ONB-02 (English pre-selected; አማርኛ rendered via fallback font)
lib/features/onboarding/steps/goal_step.dart            — ONB-03 (4 cards; Next disabled until selection; no deselect-to-none)
lib/features/onboarding/steps/body_step.dart            — ONB-04 (sex segmented Female pre-selected; age/height/current/target w/ ranges; field-level errors, no silent clamp)
lib/features/onboarding/steps/activity_step.dart        — ONB-05 (5 options; Moderate pre-selected)
lib/features/onboarding/steps/pace_step.dart            — ONB-06 (loss goal only; Conservative "Recommended" tag, Moderate pre-selected, Aggressive red "Requires discipline" + never pre-selected; Skip)
lib/features/onboarding/steps/food_preference_step.dart — ONB-07 (3 image cards; Ethiopian pre-selected; local placeholder art)
lib/features/onboarding/daily_target_screen.dart        — ONB-08 (engine output, macro tiles, START TRACKING → complete + Home)
lib/features/onboarding/widgets/step_header.dart   — back/step-label/skip slot
lib/features/onboarding/widgets/progress_bar.dart  — computed % from step index (§9)
lib/features/onboarding/widgets/option_card.dart   — shared selectable card (goal/activity/pace/preference)
lib/features/home/home_shell.dart                  — HOME-05: custom bottom nav (Home/Progress/Scan-center/Insights/Profile) + scan FAB → sheet
lib/features/home/home_screen.dart                 — HOME-01: greeting (morning/afternoon/evening), Nourish mark, avatar placeholder, notifications icon (honest void), sections
lib/features/home/widgets/calorie_ring.dart        — HOME-02: ring, "Calories Left", over-target amber/red treatment, no >100% wrap
lib/features/home/widgets/macro_pills.dart         — HOME-02: P/C/F left pills
lib/features/home/widgets/todays_meals_card.dart   — HOME-03: slots w/ aggregated totals; dashed "Not logged" → scan menu pre-scoped
lib/features/home/widgets/hydration_card.dart      — HOME-04 + WW-01: X.X/3.0 L, Add 250ml / remove (floor 0), revert+snackbar on failure
lib/features/home/providers.dart                   — todayTotalsProvider, homeDashboardProvider, water providers
lib/features/scan/scan_menu_sheet.dart             — SCAN-01 six-option bottom sheet; S0: SEARCH FOOD live; other five → honest void w/ search alternative
lib/features/search/food_search_screen.dart        — LOG-05: search field, category chips (Ethiopian/Breakfast/Lunch/Dinner/Snacks), food cards w/ default portion + kcal + (+)
lib/features/search/food_search_controller.dart    — query/category state; alias matching (incl. Amharic); preference bias ordering
lib/features/search/widgets/food_card.dart         — name, "1 piece (150g) • 225 kcal", add button
lib/features/search/widgets/category_chips.dart    — horizontal filter chips
lib/features/history/meal_history_screen.dart      — LOG-06: date strip, Daily Summary cards (Calories OF target + P/C/F), meal entries w/ P/C/F chips, LOG MEAL → scan menu
lib/features/history/widgets/date_strip.dart       — 7-day strip, today highlighted, future dates allowed-but-empty
lib/features/history/widgets/daily_summary_cards.dart — Calories/Protein/Carbs/Fat summary
lib/features/history/widgets/meal_entry_tile.dart  — "BREAKFAST • 08:30 AM", title, kcal, P/C/F chips; renders snapshots
lib/features/voids/honest_void_screen.dart         — ADR-0005: parametrized honest copy + working "Search food instead" → /search-food
lib/features/progress/progress_screen.dart         — P-HOME-3 honest empty state
lib/features/insights/insights_screen.dart         — honest empty state
lib/features/profile/profile_screen.dart           — honest empty state
lib/core/formatters.dart                           — kcal/gram/liter formatting, rounding rules (round half away from zero)
lib/core/date_utils.dart                           — dateKey(yyyy-MM-dd), local day start, greeting buckets
lib/l10n/strings.dart                              — S0 English string table (single source; i18n-ready for S1+)
test/target_engine_test.dart / portion_engine_test.dart / nutrition_engine_test.dart / snapshot_immutability_test.dart   (mirror domain tests at app boundary via repository)
test/food_search_controller_test.dart
test/onboarding_controller_test.dart
test/widget/onboarding_step_gating_test.dart
test/widget/home_ring_math_test.dart
test/widget/quick_add_flow_test.dart
test/widget/hydration_card_test.dart
```
**~115 files total** (27 domain, 23 design-system, ~67 mobile incl. 10 test files). Largest single file stays < ~300 lines (screens decomposed into widgets); justified because vertical-slice screens are inherently the largest artifacts — no monolithic god-file proposed.

## 7. pubspec dependencies (exact)

`apps/mobile` runtime:
| Package | Why |
|---|---|
| `flutter_riverpod` (3.x line) | state management — master §5 pins Riverpod |
| `go_router` (17.x line) | routing — master §5 |
| `drift` (2.x) + `drift_flutter` (0.2.x) | SQLite ORM + Flutter integration (Drift is master's "local persistent database") |
| `sqlite3_flutter_libs` | native SQLite for Android/iOS/Windows |
| `path_provider` | DB file directory |
| `path` | DB path join |
| `intl` | date formatting (date strip, AM/PM) |

Dev: `build_runner`, `drift_dev`, `flutter_lints`. Test: `flutter_test` (SDK).

**Font decision: bundle Inter (400/600/700) + Noto Sans Ethiopic, NO google_fonts.** Justification: S0 is zero-network-egress (OFF-01, master §63); `google_fonts` runtime-fetches from fonts.gstatic.com unless every style is pre-bundled anyway — bundling directly is simpler and deterministic offline. Inter lacks Ethiopic glyphs (ONB-02 requires አማርኛ to render), so Noto Sans Ethiopic ships as `fontFamilyFallback`. Fonts are OFL-licensed; the build agent downloads TTFs once and commits them under `packages/design-system/assets/fonts/`.

Wiring: `packages/domain` — **zero** runtime deps (pure Dart, testable with plain `dart test` / flutter_test). `packages/design-system` — flutter SDK only. `apps/mobile` uses path deps:
```yaml
dependencies:
  nourish_domain:          { path: ../../packages/domain }
  nourish_design_system:   { path: ../../packages/design-system }
```
Version pins: resolved by `flutter pub add` at scaffold time against Flutter 3.44.8 / Dart 3.12.2; **`pubspec.lock` is committed** (reproducible builds; Windows/CI parity).

## 8. Target engine spec (TGT-01, pure Dart in `packages/domain`)

**Constants:** activity factors — Sedentary 1.2, Light 1.375, Moderate 1.55, Very active 1.725, Athlete 1.9. Macro split — **25% protein / 45% carbs / 30% fat** of final target. `formulaVersion = "mifflin-2026-s0"`. Floors (PPA-3): female 1200, male 1500 kcal.

**Formulas:**
1. BMR (Mifflin-St Jeor): male `10w + 6.25h − 5a + 5`; female `10w + 6.25h − 5a − 161`
2. TDEE = BMR × activityFactor
3. Goal adjustment:
   - Lose weight: deficit = max(0.15×TDEE, paceKcalPerDay); pace default Moderate when skipped; target = TDEE − deficit
   - Maintain / Eat healthier: target = TDEE (±0)
   - Build muscle: target = 1.10 × TDEE
4. **Safety clamp:** target = max(target, floor(sex)). Clamp applies regardless of pace choice (incl. Aggressive) — SAFE-01 "extremely low targets refused".
5. Rounding: final target to nearest 10 kcal; macros to nearest whole gram (round half away from zero): protein = target×0.25/4, carbs = target×0.45/4, fat = target×0.30/9.
6. Input validation: age 18–100, height 100–250 cm, weights 30–350 kg, sex/goal/activity non-null, else `TargetEngineInputException` (never a fake number).
7. Re-derivation on any input change → new DailyTarget row with new `dateGenerated`; historical rows preserved (TGT-01 edge case).

**Exact unit test cases (hand-computed constants):**
| # | Input | Expected |
|---|---|---|
| 1 | M 30y 180cm 80kg, sedentary, maintain | BMR 1780 → TDEE 2136 → target 2140 |
| 2 | F 25y 165cm 60kg, moderate, maintain | BMR 1345.25 → TDEE 2085.1375 → target 2090 |
| 3 | Case 2 + lose weight, pace moderate | deficit max(312.77, 500)=500 → 1585.14 → **1590** (above floor) |
| 4 | F 45y 150cm 45kg, sedentary, lose, aggressive | 1201.8 − 1000 = 201.8 → **clamped 1200** |
| 5 | M 60y 170cm 60kg, sedentary, lose, aggressive | 1641 − 1000 = 641 → **clamped 1500** |
| 6 | Case 1 + build muscle | 1.10×2136 = 2349.6 → **2350** |
| 7 | Case 1 + eat healthier | equals maintain: **2140** |
| 8 | Determinism | same inputs twice → identical DailyTarget |
| 9 | age 12 | throws TargetEngineInputException |
| 10 | height 99 | throws |
| 11 | macros @ target 2000 | P 125g, C 225g, F 67g |
| 12 | pace skipped for lose weight | defaults Moderate (assert paceKcal 500 path) |

## 9. Portion + nutrition engine spec (TGT-02/03/04)

- `portionToGrams(food, unit, qty)` = per-food conversion table lookup × quantity. Conversions live **per food** (bowl of shiro ≠ bowl of pasta).
- `nutritionFor(per100g, grams)` = `per100g × grams / 100`, rounded half-away-from-zero to whole kcal/grams.
- Snapshot: `NutritionSnapshot` is `final`-only with const constructor; stored into `meal_items` columns at save time; history renders only snapshots (TGT-04). Editing a historical item (S2+) writes a new snapshot row.

**Test cases:** injera 1 unit=150g ✓ (design: 150g→225 kcal ⇒ per100g 150); half injera → 75g; shiro 1 cup=240g → 281 kcal (per100g 117); shiro bowl=240g vs pasta bowl=180g (per-food difference); 180 kcal/100g × 150g = 270 kcal (TGT-03 example); 2000g edge → 20×; snapshot immutability: mutate catalog food after item saved → item kcal unchanged; snapshot object is compile-time immutable; meal.totals = sum of item snapshots (round-trip test).

## 10. Route map (GoRouter)

| Path | Screen | Notes |
|---|---|---|
| `/` | Splash/bootstrap | redirects: onboarding incomplete → first unanswered step; complete → `/home` |
| `/welcome` | Welcome (ONB-01) | back from Language lands here (ONB-09) |
| `/onboarding/language` | Language | STEP 1 OF T |
| `/onboarding/goal` | Goal | Next disabled until selection |
| `/onboarding/body` | Body | field-level validation |
| `/onboarding/activity` | Activity | |
| `/onboarding/pace` | Pace | only reachable when goal=loseWeight; Skip button |
| `/onboarding/food-preference` | Food preference | |
| `/onboarding/daily-target` | Daily target summary | no counter (design shows none) |
| `/home` | Shell (4 branch pages) | custom bottom nav; Scan center = FAB → sheet (not a route — HOME-05 overlay rule) |
| `/progress`, `/insights`, `/profile` | Honest empty states | ADR-0005 real screens, honest copy |
| `/history` | Meal history | optional `?date=` |
| `/search-food` | Food search | meal-slot context via provider, not URL |
| `/honest-void/:feature` | Honest void | features: `sign-in`, `take-photo`, `choose-photo`, `describe-meal`, `use-voice`, `scan-barcode`; each shows honest "coming soon + offline explanation" copy + working **Search food instead** → `/search-food` |
| *(bottom sheet)* | Scan menu | `showModalBottomSheet`, not a route |

**Onboarding step counter strategy (resolves P-ONB-2 for S0).** The design's counters disagree ("STEP 1 OF 5", "Step 2 of 5", "Step 4 of 6", "1 OF 3", 20/25/33/40/66%). Adopted clean renumbering — **runtime-computed absolute counters over counted steps only** (Welcome and Daily target carry no counter, matching those designs): counted steps = Language(1) → Goal(2) → Body(3) → Activity(4) → [Pace(5) **only if goal = Lose weight**] → Food preference (last). Total T = **6 with pace, 5 without**. Label: `STEP n OF T`; progress bar % = n/T. This is truthful under PPA-2's conditional pace, never disagrees with what the user sees, and supersedes the design's decorative percentages (recorded as the P-ONB-2 resolution). Resume logic (ONB-09): each Continue persists that step's answer immediately; `currentOnboardingStep` stored; on relaunch redirect to first unanswered step; back-from-language → `/welcome`.

## 11. Riverpod provider graph

```
driftDatabaseProvider (Provider<AppDatabase>, lazy singleton)
  ├─ onboardingRepositoryProvider → driftDatabaseProvider
  ├─ foodRepositoryProvider       → driftDatabaseProvider
  ├─ mealRepositoryProvider       → driftDatabaseProvider
  ├─ waterRepositoryProvider      → driftDatabaseProvider
  ├─ targetRepositoryProvider     → driftDatabaseProvider + targetEngineProvider
targetEngineProvider (Provider<TargetEngine>, pure domain class)
currentUserProvider            (StreamProvider<UserProfile?> ← onboardingRepository)
activeDailyTargetProvider      (StreamProvider<DailyTarget?> ← targetRepository)
todayMealsProvider             (StreamProvider<List<Meal>> ← mealRepository)
todayTotalsProvider            (Provider<DailyTotals> ← todayMealsProvider; domain aggregation)
todayWaterProvider             (StreamProvider<WaterDay> ← waterRepository; default target 3.0 L const)
homeDashboardProvider          (Provider<HomeDashboardData> ← activeDailyTarget + todayTotals + todayWater → Calories Left, macros left, ring fraction)
onboardingControllerProvider   (Notifier<OnboardingState> ← onboardingRepository + targetEngine; holds step index, draft, field errors)
activeMealContextProvider      (Notifier<MealContext?> — slot scoping for quick-add from Home slots / scan menu)
foodSearchControllerProvider   (Notifier<FoodSearchState> ← foodRepository; query + category + preference-biased results)
selectedHistoryDateProvider    (Notifier<DateTime>)
routerProvider                 (Provider<GoRouter> ← onboarding state for redirect)
```
Widgets consume streams; controllers own mutations; all writes flow through repositories → Drift. No provider-to-provider cycles (dag above is strictly top-down).

**Seed catalog (LOG-05, PPA-8):** 20 canonical foods — injera, doro wot, shiro wot, misir wot, kik alicha, beef tibs, chechebsa, fuul, buna (coffee), kitfo, gomen, atkilt, orange, avocado, banana, egg, milk, bread, rice, pasta. Each: canonical name, 2–4 aliases incl. one Amharic spelling where sensible (e.g., doro wot → "doro wet", "doro we't", "ዶሮ ወጥ"; injera → "enjera", "እንጀራ"; shiro → "shiro wet", "ሽሮ"), categories (Ethiopian, Breakfast, Lunch, Dinner, Snacks), default portion + portion set (injera units, cups, bowls, plates, glasses, slices…; bowl grams differ per food), per-100g nutrition, and **`source: provisional-seed`** on every value (never presented as authoritative — search results carry a disclaimer footer: "Provisional values — authoritative Ethiopian FCT 2025 data ships in a coming update"). Design card numbers are approximated by computed defaults (e.g., Injera 1 piece 150g @ 150 kcal/100g = 225 kcal exactly as the design shows).

## 12. Ordered implementation task list (dependency-ordered, S/M/L)

| # | Task | Effort | Verifiable by |
|---|---|---|---|
| T0 | Preflight: confirm branch `feat/nourish-mvp`, tools, create `docs/plans/` | S | env check |
| T1 | Scaffold `packages/domain` (package template, pubspec, models/enums) | M | `dart pub get` |
| T2 | Target engine + 12 unit tests | M | green tests |
| T3 | Portion + nutrition engines + snapshot immutability + tests | M | green tests |
| T4 | Scaffold `packages/design-system`; tokens (colors/typography/spacing/radii/elevation) | M | theme smoke test |
| T5 | Design-system widget primitives (8 widgets) | M | widget smoke tests |
| T6 | Fonts: download + commit Inter 400/600/700 + Noto Sans Ethiopic; wire pubspec assets | S | `flutter test` renders አማርኛ glyph |
| T7 | Scaffold `apps/mobile` (platforms android,ios,windows; org `app.nourish`) | S | `flutter create` + analyze clean |
| T8 | Wire path deps + add runtime deps; commit pubspec.lock | S | `flutter pub get` |
| T9 | Drift: tables, AppDatabase, DAOs, build_runner generation | L | codegen compiles |
| T10 | Seed catalog (20 foods, aliases incl. Amharic, portions, per100g, `source: provisional-seed`) + idempotent importer | M | unit test: import runs once; 20 foods present |
| T11 | Repositories (onboarding/food/meal/water/target) | M | repository tests |
| T12 | Bootstrap + router + provider graph + splash | M | app boots, redirects correct |
| T13 | Welcome, Language, Goal steps | M | widget tests (gating) |
| T14 | Body (validation) + Activity + Pace + Food preference steps | L | widget tests (ranges, pace rules) |
| T15 | Daily target summary + onboarding completion + resume (ONB-09) | M | widget + controller tests |
| T16 | Home shell (5-tab nav, scan FAB) + honest-void tabs | M | widget tests |
| T17 | Home screen: greeting, calorie ring, macro pills, meals card, hydration card | L | widget tests incl. ring math, water floor |
| T18 | Scan menu sheet + routing (5 voids + search live) | M | widget test |
| T19 | Food search + quick-add into slot context | L | widget quick-add flow test |
| T20 | Meal history (date strip, summary, snapshots, LOG MEAL) | L | widget + snapshot tests |
| T21 | Honest void screen (parametrized, working search alternative) | S | widget test |
| T22 | String table + formatters + date utils | S | unit tests |
| T23 | Full widget test suite completion | M | green |
| T24 | `flutter analyze` clean, full `flutter test` green, `graphify update .`, STATE.md sync, ADR-0003/4/5 filing note | M | analyzer + test evidence |

## 13. Data/schema changes (Drift, local only)
Tables: `user_profile` (singleton), `foods`, `food_aliases`, `food_portions`, `daily_targets` (append-only history), `meals`, `meal_items` (snapshot columns: kcal, protein_g, carbs_g, fat_g, fiber_g?, sodium_mg?), `water_logs`, `seed_meta`. No remote schema. DB file via `path_provider` + `drift_flutter`. Water target default 3.0 L is a constant in S0 (adjustable via settings deferred to S3/S4).

## 14. Security implications
- **No network egress** — smallest possible attack surface; no secrets, no tokens in S0.
- Health data is sensitive (SAFE-02): stored in app-private SQLite; **unencrypted at rest in S0** — accepted provisional risk, flagged; at-rest encryption joins S3 (auth/secure-storage ADR) before any sync.
- No analytics, no remote images (design's remote food photography replaced by local placeholder gradients/icons — zero-egress rule; asset pipeline deferred to S1+).
- Seed values labeled `source: provisional-seed`; UI disclaimer copy so nothing is presented as authoritative (ADR-0004(e), master §71).

## 15. Observability/logging
S0: structured local logging via `dart:developer` log with categories (`bootstrap`, `seed`, `meal`, `target`); user-facing failures surfaced as snackbars + honest states (HOME-04 revert). Sentry/analytics deferred — no egress permitted. Logging is category-level only so future telemetry cannot violate SAFE-02.

## 16. Test matrix (acceptance list, mapped to behavior IDs)

| Behavior | Test(s) | Where |
|---|---|---|
| ONB-01 | both buttons reachable; GET STARTED → language | widget |
| ONB-02 | English pre-selected; Amharic glyph renders; selection persists; back → welcome | widget |
| ONB-03 | Next disabled until selection; single-selection enforced; re-tap doesn't deselect | widget (step gating) |
| ONB-04 | age 12 → field error + blocked; out-of-range height/weight blocked; valid → advance | widget |
| ONB-05 | Moderate pre-selected; Athlete → pace (loss goal) | widget |
| ONB-06 | Moderate pre-selected; Conservative "Recommended"; Aggressive never pre-selected; Skip advances; pace hidden for non-loss goals | widget + controller |
| ONB-07 | Ethiopian pre-selected; continue → daily target | widget |
| ONB-08 | kcal equals engine output for inputs; START TRACKING → Home + persisted target | widget + engine |
| ONB-09 | kill/relaunch mid-flow → resume at first unanswered step; answers retained | controller + widget |
| HOME-01/02 | Calories Left = target − consumed; ring fraction; over-target state; missing target → setup prompt (never zeroes) | unit + widget (ring math) |
| HOME-03 | filled slots show totals; "Not logged" → scan menu pre-scoped; multiple items per slot render | widget |
| HOME-04 / WW-01 | add 250ml → +0.25 L persisted; remove floors at 0; persistence failure reverts | widget |
| HOME-05 | scan center opens sheet over Home; tabs switch; Progress/Insights/Profile honest voids | widget |
| SCAN-01 | sheet shows 6 options; SEARCH FOOD works; other 5 → honest void with search alternative; close restores state | widget |
| LOG-05 | "doro wet"/"ዶሮ ወጥ" → Doro Wot; category chips filter; quick-add adds default portion kcal | unit + widget |
| LOG-06 | date selection re-renders; future date empty; history shows snapshot values after catalog change; LOG MEAL → sheet | widget + snapshot test |
| TGT-01 | 12 engine cases (§8) | unit |
| TGT-02 | portion conversion table incl. per-food bowls | unit |
| TGT-03 | per100g × grams/100; rounding | unit |
| TGT-04 | immutability | unit |
| OFF-01 | all S0 features work with no network (implicit: zero egress by construction; verified by grep for http calls) | analyzer + manual check |

**~50 automated test cases** across 10 test files. Quality gates: `flutter analyze` clean (0 issues), `flutter test` green, no dead buttons (every route terminates in a real screen or honest void).

## 17. Migration/rollback
Greenfield: rollback = revert slice commits on `feat/nourish-mvp`. Drift schema version 1; future slices use Drift migrations (versioned `schemaVersion`, `MigrationStrategy`). Seed re-import is idempotent via `seed_meta` version. Committing `pubspec.lock` makes builds reproducible across the swarm.

## 18. Integration risks
1. **S1 will introduce the API layer** — repositories are already interface-shaped (repository classes above Drift); swapping the food catalog to API+offline-cache in S1 must touch data sources only, not features.
2. **`pubspec.lock` committed** — Windows/CI parity required; agents must not hand-edit lock.
3. **Windows dev caveats** — Drift needs `sqlite3_flutter_libs` on Windows desktop too; VM/deep-link quirks on desktop don't block mobile-first verification.
4. **Font bundling** — build agent must download TTFs once and commit; missing Ethiopic fallback silently breaks ONB-02 (render አማርኛ as tofu) — covered by a glyph test.
5. **No food photography in S0** — placeholder gradient/icon art replaces design's remote images (no egress); visual fidelity gap is intentional and documented; real assets come with the S1 asset pipeline.
6. **Provisional values** — floors/ranges/macro split are PPA-3-class assumptions; if product sign-off changes them, only `target_engine.dart` constants + tests change.
7. **Referenced ADRs missing** — ADR-0003/0004/0005 need filing by @architect (pattern implemented regardless).
8. **Design counter inconsistency** — resolved by computed counters (§9); if vision objects, it's one function + widget tests.

## 19. Deferred to S1+ (explicit)
Backend/NestJS + FCT-2025 canonical catalog import (S1); photo/voice/text AI lanes + analysis/result/low-confidence screens + meal editor (SCAN-05/06/07) (S2); auth/OTP + sync + encrypted-at-rest + secure storage (S3); water/weight screens, insights, recommendations, settings/target adjustment (S4); website/release infra (S5). Also deferred: custom foods (P-LOG-4), calendar picker (P-LOG-5), portion editing UI, i18n content (strings architecture ready), Sentry, subscriptions, profile editing, food details screen.

## 20. Definition of Done
Blueprint approved by @architect → PLANNED; after implementation: `flutter analyze` 0 issues; `flutter test` ~50 cases green; every §4 acceptance criterion evidenced; app runs fully offline end-to-end (onboard → target → home → search → quick-add → history → water); zero network egress verified by code inspection; `graphify update .` run; `pubspec.lock` committed; atomic commit on `feat/nourish-mvp`.

## 21. Planning quality gates (self-review)
- No circular dependency: strict 3-layer dag (domain → design-system → app) — PASS.
- Every acceptance criterion has a verification method: §16 test matrix — PASS.
- No hidden behavior: honest-void lanes + PPA header document all assumptions — PASS.
- No scope expansion: all extra screens are mandated honest voids (ADR-0005 pattern) — PASS.
- No unjustified monolithic file: max ~300 lines per file, feature-decomposed — PASS.
