# Targets, Portions & Nutrition Engine Behaviors (TGT)

Sources: Master §9–§14, §16, §22; `Design/daily_target_summary`, `Design/home_screen`.

These are the deterministic numeric rules of the product. The AI never plays
the role of final calculator.

---

## TGT-01: Calorie target computation

- **Actor:** backend (system rule); surfaced in onboarding (ONB-08)
- **Trigger:** onboarding completes or target inputs change
- **Preconditions:** sex, age, height, current weight, goal, activity level,
  optional pace — all validated (SAFE-01)
- **Action:** system computes a daily calorie target
- **Visible state:** the target appears on the daily target screen (ONB-08),
  Home (HOME-02), and progress surfaces
- **Expected outcome:** the target comes from a configurable BMR/TDEE
  calculation, then adjusted by goal and pace. The system records: formula
  version, activity factor, goal adjustment, pace, resulting target, and the
  date generated. Changing any input re-derives and re-records the target.
  The AI may *explain* a target but never decides it.
- **Failure outcome:** inputs outside validated ranges (SAFE-01) never
  produce a target; the user is corrected at the input step
- **Edge cases:**
  - Extreme weight-goal pacing must be refused by safety rules, not by the
    math (SAFE-01)
  - Re-derivation on input change must not silently rewrite historical
    targets — past targets remain recorded with their generation date
- **Acceptance examples:**
  - Given identical inputs, When targets are computed twice (even across
    devices for the same account), Then the same target results
  - Given the user changes activity from Sedentary to Athlete, When targets
    re-derive, Then a new target is recorded with a new generation date and
    the old target is preserved historically

---

## TGT-02: Portion engine

- **Actor:** backend (system rule); user-facing unit pickers
- **Trigger:** any portion selection or estimate
- **Preconditions:** food exists in the food layer
- **Action:** system converts a chosen portion into grams
- **Visible state:** pickers offer food-appropriate units
- **Expected outcome:** the engine supports: grams, kilograms, milliliters,
  servings, pieces, plates, half plates, bowls, cups, glasses, spoons,
  ladles, small/regular/large sizes, and injera-specific units (half injera,
  one injera, large injera). All conversions live in the database per food.
  Conversions are never hardcoded inside AI prompts.
- **Failure outcome:** a portion unit unsupported for a food is not offered;
  an AI-proposed unit that fails validation is rejected (SCAN system rule)
- **Edge cases:** the same unit can mean different grams for different foods
  (a "bowl" of shiro vs. a "bowl" of pasta)
- **Acceptance examples:**
  - Given "Injera" with 1 injera = 150 g in the database, When the user logs
    "one injera", Then the engine computes 150 g
  - Given "Shiro Wot" with 1 cup = 240 g, When the user logs "1 cup", Then
    the engine computes 240 g without consulting any AI

---

## TGT-03: Nutrition computation

- **Actor:** backend (system rule)
- **Trigger:** any meal item finalization (log, edit, confirm)
- **Preconditions:** food with per-100g (or per-portion) nutrition; grams
  resolved via TGT-02
- **Action:** compute nutrition for the amount
- **Visible state:** kcal and macro figures on result, summary, and history
  screens
- **Expected outcome:** deterministic rules:
  - Basic food: `nutrition_per_100g × grams / 100`
  - Recipe: `sum(ingredient nutrition) ÷ servings`
  Computed fields: calories, protein, fat, carbohydrates, fiber, sodium, and
  other nutrients when data exists. Rounding is consistent and documented.
  The AI is never the final nutrition calculator.
- **Failure outcome:** a food with no nutrition data cannot be saved as a
  complete meal item — it is flagged; estimated values are never silently
  substituted for missing data
- **Edge cases:** recipe-of-the-same-dish ≠ identical nutrition (the model
  supports per-recipe/preparation variation); no hardcoded nutrition in
  prompts
- **Acceptance examples:**
  - Given a food at 180 kcal/100g, When the user logs 150 g, Then the item is
    270 kcal
  - Given a recipe totaling 2,400 kcal with 4 servings, When the user logs 1
    serving, Then the item is 600 kcal

---

## TGT-04: Nutrition snapshots (historical immutability)

- **Actor:** backend (system rule)
- **Trigger:** a meal item is saved
- **Preconditions:** item finalized and confirmed by the user
- **Action:** system stores, alongside the meal item, the nutrition values
  used at logging time (snapshot)
- **Visible state:** history screens render snapshots
- **Expected outcome:** future food-database changes never alter what a
  historical meal shows or contributes. Editing a historical meal creates a
  new snapshot for the edited items.
- **Failure outcome:** n/a (system guarantee)
- **Acceptance examples:**
  - Given a saved meal at 420 kcal, When the food database later updates that
    food to 460 kcal, Then history and past progress still show 420 kcal

---

## TGT-05: Food layer normalization (system rule)

- **Actor:** backend (system rule)
- **Trigger:** any food reference (search, AI output, logging)
- **Preconditions:** food database
- **Action:** resolve references to canonical foods
- **Visible state:** search and results show one canonical food per concept
- **Expected outcome:** names, aliases, transliterations, and common
  misspellings across English and Amharic resolve to one canonical food.
  Authoritative nutrition comes from the Ethiopian Food Composition Table 2025
  where available; every imported value keeps provenance: source name, source
  version, source food code, source reference, import date. Values are never
  fabricated when source data exists.
- **Failure outcome:** unresolved references surface as choices to the user
  (low-confidence flow) rather than being silently mapped to a wrong food
- **Acceptance examples:**
  - Given "doro wot", "doro wet", "doro we't", and "ዶሮ ወጥ", When each is
    searched, Then all resolve to the same canonical food with its provenance
    recorded
