# Home Dashboard Behaviors (HOME)

Sources: `Design/home_screen`, `Design/meal_history_log` (cross-check), Master §3, §62.

The Home screen is the primary daily surface. It must load fast and must never
block on AI requests.

---

## HOME-01: Home screen composition

- **Actor:** signed-in user who completed onboarding
- **Trigger:** app opens, or Home tab selected
- **Preconditions:** active session; daily target exists (TGT-01)
- **Action:** view
- **Visible state:** top bar (avatar, time-based greeting, "Nourish" mark,
  notifications icon); calorie visualization card; macro pills; Today's Meals
  list; Hydration card; bottom navigation (mobile) or floating nav (desktop)
- **Expected outcome:** all figures reflect *today* for this user: consumed
  calories vs. target, remaining macros, meals logged today, water logged today.
- **Failure outcome:** if today's data cannot be fetched, the last cached
  dashboard renders (with staleness not shown to the user) and manual logging
  still works (OFF-01)
- **Edge cases:**
  - Greeting is time-based: morning / afternoon / evening
  - Home must render from cache instantly; network refresh happens in the
    background
- **Acceptance examples:**
  - Given a user with a 2,180 kcal target who logged 760 kcal today, When Home
    opens, Then it shows 1,420 Calories Left and the ring is proportionally filled
  - Given a fresh app open, When network is slow, Then Home renders cached data
    immediately and updates when the fetch completes

---

## HOME-02: Calorie and macro progress

- **Actor:** signed-in user
- **Trigger:** Home open (live update on any log change)
- **Preconditions:** daily target + today's meals
- **Action:** view
- **Visible state:** central circular calorie visualization with a large
  "Calories Left" figure; pills for "Protein Xg left", "Carbs Xg left",
  "Fat Xg left"
- **Expected outcome:** Calories Left = target − consumed (floor at 0 is NOT
  used; going over target must be visibly representable — see edge cases).
  Macro "left" values update identically. Values derive from saved meals only,
  never from estimates still in an unsaved edit state.
- **Failure outcome:** if the target is missing, Home shows a prompt to
  complete onboarding/target setup instead of rendering zeroes
- **Edge cases:**
  - Over-budget days: remaining values go negative or the visualization shows
    an over-target state (amber/red treatment per DESIGN.md caution colors)
  - Ring progress beyond 100% must not wrap visually
- **Acceptance examples:**
  - Given target 2,180 kcal and 780 kcal logged, When a 650 kcal lunch is
    confirmed, Then Calories Left updates from 1,400 to 750 immediately
  - Given 0 kcal logged, When Home opens, Then Calories Left equals the full
    target

---

## HOME-03: Today's Meals list

- **Actor:** signed-in user
- **Trigger:** Home open
- **Preconditions:** none (list may be empty)
- **Action:** view; tap "See All"; tap a meal entry
- **Visible state:** section "TODAY'S MEALS" with See All link; entries show
  thumbnail, meal name (e.g., Breakfast), primary food description, kcal
  total; a dashed "Not logged" entry acts as an add affordance for unfilled
  slots
- **Expected outcome:**
  - Meal slots follow a standard set (Breakfast / Lunch / Dinner / Snack as
    available; the design shows Breakfast, Lunch, Dinner with a Snack entry in
    history — see pending-behaviors.md P-HOME-1)
  - See All opens the meal history screen (LOG-06)
  - Tapping a filled entry opens that meal's detail/edit; tapping a "Not
    logged" entry opens the scan menu (SCAN-01) pre-scoped to that meal slot
- **Failure outcome:** a meal that failed to save must not appear in the list
- **Edge cases:** multiple entries per meal slot (e.g., two snacks) must
  render without breaking the slot structure
- **Acceptance examples:**
  - Given a day with breakfast and lunch logged, When Home opens, Then
    Breakfast (420 kcal) and Lunch (780 kcal) appear and Dinner shows "Not
    logged"
  - Given the "Not logged" Dinner entry, When tapped, Then the scan menu opens

---

## HOME-04: Hydration quick actions

- **Actor:** signed-in user
- **Trigger:** Home open
- **Preconditions:** water target exists (WW-01)
- **Action:** tap "Add 250ml" or the remove (−) control
- **Visible state:** Hydration card: current liters "2.1 / 3.0 L", progress
  bar, plus 250ml button, minus button
- **Expected outcome:** each add/remove immediately updates the displayed
  liters and progress and persists a water log entry. Removing cannot take the
  total below zero.
- **Failure outcome:** if persistence fails, the UI reverts and an error snack
  appears; the user can retry
- **Edge cases:** offline taps queue (OFF-01); rapid taps must not double-count
- **Acceptance examples:**
  - Given 2.1 L logged, When the user taps Add 250ml, Then the card shows 2.35 L
  - Given 0.0 L, When the user taps remove, Then nothing changes and no error
    is shown

---

## HOME-05: Navigation shell (app-wide)

- **Actor:** signed-in user
- **Trigger:** any primary screen
- **Preconditions:** not inside a transactional flow (scan, analysis, edit,
  onboarding — those suppress the shell)
- **Action:** tap a tab
- **Visible state:** mobile bottom bar: Home, Progress, Scan (raised center
  action), Insights, Profile. Desktop: equivalent floating pill nav.
- **Expected outcome:** each tab opens its primary screen; the Scan center
  action opens the scan menu (SCAN-01) as an overlay, not a navigation away
  from context. Active tab is highlighted.
- **Failure outcome:** n/a
- **Edge cases:**
  - The meal history design shows a *different* tab set (Log/Insights/Kitchen/
    Profile). The Home five-tab shell is canonical until resolved — see
    pending-behaviors.md P-HOME-2
  - Progress and Kitchen destinations exist in navigation but have no shipped
    design; tapping them must not dead-end silently (see P-HOME-3)
- **Acceptance examples:**
  - Given Home is active, When the user taps the Scan center button, Then the
    scan menu bottom sheet opens over Home and Home remains behind it
