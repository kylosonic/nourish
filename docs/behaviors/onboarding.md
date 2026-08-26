# Onboarding Behaviors (ONB)

Sources: `Design/welcome_screen`, `Design/language_selection`, `Design/goal_selection`,
`Design/body_information`, `Design/activity_level`, `Design/preferred_pace`,
`Design/food_preference`, `Design/daily_target_summary`, Master §2, §14.

Onboarding is a linear, transactional flow. Bottom navigation is suppressed on
every onboarding step. Each step has a progress indicator, a back control (where
shown), and a fixed bottom action bar.

---

## ONB-01: Welcome

- **Actor:** first-time visitor (not signed in)
- **Trigger:** app opens with no active session
- **Preconditions:** none
- **Action:** none required — the screen presents two choices
- **Visible state:** full-bleed hero food photo with gradient; product mark;
  headline "Eat smarter. Understand your food."; subtitle "AI-powered nutrition
  tracking built for the way you eat."; two buttons
- **Expected outcome:**
  - Tap **GET STARTED** → onboarding flow begins (ONB-02)
  - Tap **I ALREADY HAVE AN ACCOUNT** → sign-in (AUTH-02)
- **Failure outcome:** n/a (no network required to render this screen)
- **Edge cases:**
  - Returning user with an active session never sees this screen; they land on
    Home (HOME-01)
  - The two buttons must both be reachable without scrolling
- **Acceptance examples:**
  - Given a fresh install, When the app opens, Then the welcome screen shows
    GET STARTED as the primary (solid green) button and I ALREADY HAVE AN
    ACCOUNT as the secondary (outlined) button
  - Given the welcome screen, When the user taps GET STARTED, Then the language
    step (ONB-02) opens

---

## ONB-02: Language selection

- **Actor:** new user in onboarding
- **Trigger:** GET STARTED tapped, or arrival from previous step
- **Preconditions:** onboarding started, not yet completed
- **Action:** user selects one language, taps Continue
- **Visible state:** progress bar (~20%), label "STEP 1 OF 5", back button,
  headline "Language", radio cards: English (pre-selected), Amharic (አማርኛ),
  Afaan Oromoo. Fixed bottom Continue button.
- **Expected outcome:** exactly one language is selected at all times.
  Continue persists the selection and advances to goal selection (ONB-03).
  The chosen language applies to the rest of onboarding immediately.
- **Failure outcome:** n/a — a default (English) is pre-selected, so Continue
  can never be blocked on this step
- **Edge cases:**
  - Switching languages mid-onboarding must not lose earlier answers
  - Amharic must render with a font that supports the script
- **Acceptance examples:**
  - Given the language step, When the user opens it, Then English is selected
  - Given the language step, When the user selects Amharic and taps Continue,
    Then goal selection (ONB-03) appears with Amharic labels

---

## ONB-03: Goal selection

- **Actor:** new user in onboarding
- **Trigger:** Continue from language step
- **Preconditions:** language persisted
- **Action:** user taps one of four goal cards, then taps Next
- **Visible state:** progress bar (~25%), headline "What is your goal?",
  sub-copy "Select one to help us personalize your plan.", cards:
  **Lose weight**, **Build muscle**, **Maintain weight**, **Eat healthier**.
  Next is disabled (dimmed, not tappable) until a card is selected. Selected
  card shows green border + tinted background + filled icon.
- **Expected outcome:** exactly one goal is selectable at a time (selecting a
  new card deselects the previous). Next becomes enabled only after a selection.
  Next persists the goal and advances (ONB-04).
- **Failure outcome:** Next cannot be activated without a selection
- **Edge cases:**
  - Tapping a selected card again must not deselect it into a no-selection state
  - The persisted goal later drives pace options (ONB-06) and the calorie
    target calculation (TGT-01); "Eat healthier" implies weight maintenance
    unless the user indicates otherwise
- **Acceptance examples:**
  - Given the goal step with nothing selected, When the user taps Next, Then
    nothing happens and the button remains disabled
  - Given the goal step, When the user taps "Lose weight" then "Build muscle",
    Then "Build muscle" is the single selected card and Next is enabled

---

## ONB-04: Body information

- **Actor:** new user in onboarding
- **Trigger:** Next from goal selection
- **Preconditions:** goal persisted
- **Action:** user fills fields and taps Continue
- **Visible state:** back button, progress bar (~33%), headline "Your body",
  fields: Biological sex segmented control (Female pre-selected, Male), Age
  (years), Height (cm), Current Weight (kg), Target Weight (kg). Continue at
  bottom.
- **Expected outcome:** all values are numeric and validated for sane ranges
  (see SAFE-01 for the safety boundaries). Continue persists all values and
  advances (ONB-05).
- **Failure outcome:** if any field is empty or out of the accepted range,
  Continue is blocked and the offending field is visibly marked (error state)
- **Edge cases:**
  - Target Weight may be above, below, or equal to Current Weight — the app
    does not judge direction here; goal + pace govern it
  - Values must not silently clamp into a valid range; the user must be told
    what range is accepted
- **Acceptance examples:**
  - Given the body step, When the user enters age 12, Then the field is marked
    invalid and Continue is blocked (minors are out of scope — see SAFE-01)
  - Given the body step with valid values, When the user taps Continue, Then
    activity level (ONB-05) opens

---

## ONB-05: Activity level

- **Actor:** new user in onboarding
- **Trigger:** Continue from body information
- **Preconditions:** body data persisted
- **Action:** user selects one of five levels, taps Continue
- **Visible state:** progress (~40%), label "Step 2 of 5", headline "Activity
  level", sub-copy "How active are you on a typical day?", options: **Sedentary**,
  **Light**, **Moderate** (pre-selected), **Very active**, **Athlete**. Continue
  at bottom.
- **Expected outcome:** exactly one level selected at all times; Continue
  persists the selection and advances (ONB-06). The level maps to an activity
  factor used by the target engine (TGT-01).
- **Failure outcome:** n/a — Moderate is pre-selected, so Continue is never
  blocked
- **Edge cases:** the selection can be changed freely before Continue; no data
  is lost
- **Acceptance examples:**
  - Given the activity step, When it opens, Then "Moderate" is selected
  - Given the activity step, When the user selects "Athlete" and taps Continue,
    Then the pace step (ONB-06) opens

---

## ONB-06: Preferred pace

- **Actor:** new user in onboarding
- **Trigger:** Continue from activity level
- **Preconditions:** goal + activity persisted
- **Action:** user selects a pace, taps Continue (or Skip)
- **Visible state:** progress (~66%), label "Step 4 of 6", back button, Skip
  link in header, headline "Preferred pace", options as cards showing a metric
  value and description:
  - **Conservative** — "Recommended" tag — −0.25 kg/week
  - **Moderate** — pre-selected — −0.5 kg/week
  - **Aggressive** — warning tag "Requires discipline" in red — −1.0 kg/week
- **Expected outcome:** exactly one pace selected; Continue persists it and
  advances (ONB-07). Skip advances without recording a pace (a default is
  applied later by the target engine). Aggressive is never pre-selected.
- **Failure outcome:** n/a — Moderate pre-selected; Continue never blocked
- **Edge cases:**
  - Pace is a *weight-direction* concept (kg/week). For a maintain-weight or
    build-muscle goal the numbers shown must reflect that goal; a loss pace
    must never be silently applied to a muscle-building user. (Open — see
    pending-behaviors.md P-ONB-1)
  - "Skip" exists on this step only; it must not skip the whole onboarding
- **Acceptance examples:**
  - Given the pace step, When it opens, Then Moderate is selected and
    Conservative carries a "Recommended" tag
  - Given the pace step, When the user taps Skip, Then no pace is recorded and
    the next step opens

---

## ONB-07: Food preference

- **Actor:** new user in onboarding
- **Trigger:** Continue/Skip from pace
- **Preconditions:** goal, activity, pace persisted
- **Action:** user selects one of three preferences, taps Continue
- **Visible state:** progress (~33% within its sub-flow), label "1 OF 3", back
  button, headline "What do you usually eat?", copy "We'll use this to build
  your baseline nutritional targets and suggest relevant meals.", image cards:
  **Ethiopian** (pre-selected), **Mixed**, **International**
- **Expected outcome:** exactly one preference selected; Continue persists it
  and advances (ONB-08). The preference biases food search results and AI
  recommendations (INS-05) but never *blocks* foods outside the preference.
- **Failure outcome:** n/a — Ethiopian pre-selected
- **Edge cases:** a user who chose "International" must still be able to search
  and log Ethiopian foods
- **Acceptance examples:**
  - Given the food preference step, When it opens, Then Ethiopian is selected
  - Given the food preference step, When the user selects Mixed and taps
    Continue, Then the daily target step (ONB-08) opens

---

## ONB-08: Daily target summary

- **Actor:** new user finishing onboarding
- **Trigger:** Continue from food preference
- **Preconditions:** all previous onboarding answers persisted; calorie target
  computed by the target engine (TGT-01)
- **Action:** user reviews and taps START TRACKING
- **Visible state:** card with food hero image, label "YOUR DAILY TARGET", large
  calorie figure + "kcal", three macro tiles — PROTEIN, CARBS, FAT — each with a
  grams value and a progress-style bar, primary button **START TRACKING**,
  footnote "You can always adjust this in settings."
- **Expected outcome:** the shown numbers are the output of the target engine,
  not hardcoded values. START TRACKING marks onboarding complete, persists the
  target with its formula metadata, and lands the user on Home (HOME-01).
- **Failure outcome:** if the target engine cannot produce a target (missing or
  invalid inputs), onboarding cannot complete; the user is returned to the
  offending step rather than shown a fake number
- **Edge cases:**
  - The macro bars on this screen are decorative representation of the
    targets (per-macro share of calories), not current-day consumption
  - Re-running onboarding (e.g., new device after sign-in) re-derives the
    target with the stored inputs and shows the same result
- **Acceptance examples:**
  - Given completed onboarding inputs, When the daily target screen opens, Then
    the kcal value equals the engine-computed target for those inputs
  - Given the daily target screen, When the user taps START TRACKING, Then
    onboarding is marked complete and Home opens

---

## ONB-09: Onboarding interruption & resumption

- **Actor:** new user
- **Trigger:** user closes the app or backs out mid-flow
- **Preconditions:** onboarding started, not complete
- **Action:** reopen the app
- **Visible state:** n/a
- **Expected outcome:** completed steps persist. The user resumes at the first
  unanswered step (for the same install), or — if the account was created
  elsewhere — at the welcome/sign-in screen for the same account. Answers are
  never silently re-derived from defaults.
- **Failure outcome:** if persistence fails, the user restarts onboarding
  rather than entering a half-configured app
- **Edge cases:**
  - Back from the language step exits onboarding (returns to welcome); back
    between later steps returns one step
  - Onboarding must be completable without any network call (target computation
    is deterministic and local)
- **Acceptance examples:**
  - Given onboarding completed through goal selection, When the user kills the
    app and reopens, Then body information opens with the chosen goal retained
