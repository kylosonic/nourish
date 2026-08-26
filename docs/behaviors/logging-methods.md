# Logging Method Behaviors (LOG)

Sources: `Design/food_search`, `Design/meal_history_log`, Master §10–§13,
§18–§22.

---

## LOG-01: Text meal logging

- **Actor:** signed-in user
- **Trigger:** DESCRIBE MEAL from scan menu
- **Preconditions:** active session
- **Action:** user types a description and submits
- **Visible state:** text entry (screen not designed — P-LOG-1). Design
  language: an editable list of detected entries with portions, followed by
  confirm — mirroring SCAN-05's confirmation pattern.
- **Expected outcome:** free text like "2 injera with shiro and an orange"
  produces: detected foods → normalized to canonical foods → nutrition
  retrieved → portions estimated → editable entries. The user confirms before
  anything is saved. Confirmation shows the same summary/confirm affordances
  as SCAN-05.
- **Failure outcome:**
  - Nothing recognizable in the text → the user lands in manual food search
    (LOG-05) instead of a dead end
  - Unresolvable portion (e.g., "some") → item appears with a default portion,
    clearly marked editable before save
- **Edge cases:** quantities map through the portion engine (TGT-02); mixed
  language input ("2 እንጀራ with shiro") must not break detection
- **Acceptance examples:**
  - Given the text "2 injera with shiro and an orange", When submitted, Then
    an editable list appears containing injera (qty 2), shiro, and orange
    before any save happens

---

## LOG-02: Voice logging

- **Actor:** signed-in user
- **Trigger:** USE VOICE from scan menu
- **Preconditions:** microphone permission (prompted on first use)
- **Action:** user speaks, stops, reviews
- **Visible state:** recording control; after capture, the **transcript** is
  shown for review before parsing continues
- **Expected outcome:** pipeline: speech-to-text → food extraction → food
  normalization → nutrition calculation. The transcript must be visible and
  editable (correct mis-transcriptions) before saving; the user confirms the
  parsed items as in LOG-01.
- **Failure outcome:**
  - Permission denied → explain + fall back to text logging
  - Unusable audio → message + retry; never a guessed result
- **Edge cases:** voice logging runs the same downstream pipeline as text —
  there is no separate nutrition path
- **Acceptance examples:**
  - Given the user says "one bowl of misir wot", When capture ends, Then the
    transcript "one bowl of misir wot" is displayed and must be confirmed
    before the meal is saved

---

## LOG-03: Barcode scanning

- **Actor:** signed-in user
- **Trigger:** SCAN BARCODE from scan menu (or barcode icon in food search)
- **Preconditions:** camera available
- **Action:** aim at barcode
- **Visible state:** barcode capture UI (not designed — P-LOG-2)
- **Expected outcome:** barcode → packaged-product lookup → verified product
  with nutrition → log with portion. If the product is in the product
  database, its nutrition is authoritative.
- **Failure outcome:** barcode unknown →
  1. offer nutrition-label OCR (LOG-04), and
  2. offer manual product entry.
  **Never invent packaged product nutrition.**
- **Edge cases:** re-scan of a known product must return the same product;
  user-created products are marked as user-submitted, not official
- **Acceptance examples:**
  - Given a scanned barcode present in the database, When the product loads,
    Then its nutrition values come from the database
  - Given an unknown barcode, When the scan finishes, Then the user sees OCR
    and manual options and no nutrition values are guessed

---

## LOG-04: Nutrition-label OCR

- **Actor:** signed-in user
- **Trigger:** fallback from unknown barcode
- **Preconditions:** packaged product photo with a nutrition label
- **Action:** photograph the label
- **Visible state:** capture UI (not designed — P-LOG-3), then a confirmation
  screen with extracted fields
- **Expected outcome:** extracted fields: product, serving size, calories,
  protein, carbohydrates, fat, fiber, sodium, ingredients. Confirmation before
  saving is mandatory; the user can correct any field.
- **Failure outcome:** unreadable label → message + retry; manual entry
  offered; nothing guessed
- **Edge cases:** OCR output is a proposal — the user is the final authority
  before a product is saved
- **Acceptance examples:**
  - Given a clear label photo, When OCR completes, Then a pre-filled form
    appears and the product is saved only after the user confirms it

---

## LOG-05: Food search & quick add

- **Actor:** signed-in user
- **Trigger:** SEARCH FOOD from scan menu; search fallback from text logging;
  food swap in the meal editor
- **Preconditions:** active session (offline: cached catalog per OFF-01)
- **Action:** type a query, or browse, then add
- **Visible state:** back control, "Search Foods" title, search field with a
  barcode shortcut icon, horizontal category chips (Ethiopian, Breakfast,
  Lunch, Dinner, Snacks), "Common Local Foods" cards — each with image, name,
  default portion ("1 piece (150g)") and kcal, and an **add** (+) button;
  empty-state hint "Type above to search our database."
- **Expected outcome:**
  - Search matches canonical foods through names, aliases, transliterations,
    and common misspellings in English and Amharic (e.g., "doro wot",
    "doro wet", "doro we't", "ዶሮ ወጥ" → one food)
  - Tap (+) adds the food at its default portion into the current logging
    context (meal in progress / chosen meal slot)
  - Results respect the user's food preference bias (ONB-07) but never exclude
    other foods
- **Failure outcome:** no matches → the empty state explains it; the user can
  create a custom food (LOG-06 is out of scope — custom food creation is
  P-LOG-4)
- **Edge cases:**
  - Adding a food mid-search is a quick add; the portion is editable from the
    resulting meal summary
  - Category chips filter the results, not the search database itself
- **Acceptance examples:**
  - Given the query "doro wet", When the user searches, Then the canonical
    "Doro Wot" food appears
  - Given "Injera (Teff)" at default 1 piece (150g) / 225 kcal, When the user
    taps +, Then the current meal gains injera at 150g / 225 kcal

---

## LOG-06: Meal history log

- **Actor:** signed-in user
- **Trigger:** See All from Home, or History/Log destination
- **Preconditions:** some logged data
- **Action:** browse days, tap LOG MEAL
- **Visible state:** top bar with calendar icon; horizontal date strip
  (weekday + day number, today highlighted); **Daily Summary** cards
  (Calories with "OF target" progress, Protein, Carbs, Fat); "Today's Meals"
  list — entries show meal type + time (e.g., "BREAKFAST • 08:30 AM"), food
  title, kcal, P/C/F chips; **LOG MEAL** button
- **Expected outcome:**
  - Selecting a past date re-renders summary + meals for that date
  - The calendar icon opens a full date picker (behavior required; picker
    design pending — P-LOG-5)
  - LOG MEAL opens the scan menu
- **Failure outcome:** a date with no data shows empty states (no fabricated
  entries); navigation to an invalid future date is prevented or warns
- **Edge cases:** entries are immutable snapshots (TGT-04) — re-rendering an
  old date must show the values as logged, even if the food database changed
  since
- **Acceptance examples:**
  - Given today (THU 24) selected, When the user taps FRI 25 (future), Then
    the list shows the future date as empty
  - Given a meal logged as 420 kcal on the 22nd, When the user views the 22nd
    after the food database changed, Then it still shows 420 kcal

---

## LOG-07: Saved meals & recipes (roadmap behavior)

- **Actor:** signed-in user
- **Trigger:** future capability listed in Master §2 (Saved meals, Recipes)
- **Expected outcome:** reserved for a later release; NOT in the first
  production candidate (Master §69). The food model must not preclude them
  (recipes compose ingredients with portions and servings).
- **Acceptance examples:**
  - Given the first release, When the user looks for a recipe builder, Then it
    is not present
