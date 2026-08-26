# Water & Weight Behaviors (WW)

Sources: Master §29–§30; `Design/home_screen` (hydration card). Dedicated water
and weight screens are not yet designed (P-WW-1, P-WW-2).

---

## WW-01: Water target & logging

- **Actor:** signed-in user
- **Trigger:** Home hydration card, or water screen (future)
- **Preconditions:** daily water target exists (default provided; adjustable)
- **Action:** add or remove water
- **Visible state:** liters today "X.X / Y.Y L", progress bar, quick add of
  250 ml, remove control
- **Expected outcome:** each action persists a water log entry with timestamp;
  the daily total updates immediately. The daily target is user-adjustable
  and applies to the current day onward.
- **Failure outcome:** persistence failure → revert + retry (HOME-04)
- **Edge cases:** remove floors at zero; logs are per-day and roll over at
  local midnight
- **Acceptance examples:**
  - Given a 3.0 L target and 2.1 L logged, When the user adds 250 ml, Then
    "2.35 / 3.0 L" shows

---

## WW-02: Water reminders

- **Actor:** system
- **Trigger:** reminder schedule (opt-in)
- **Preconditions:** user enabled reminders; notification permission granted
- **Action:** system sends a reminder
- **Visible state:** a notification nudge to drink
- **Expected outcome:** reminders follow a user-configurable schedule; they
  stop for the day once the target is met; they can be turned off entirely.
- **Failure outcome:** if notifications are unavailable, the app degrades
  silently (no error to the user) and reminders simply do not arrive
- **Acceptance examples:**
  - Given reminders enabled and target met at 3.0 L, When the next reminder
    time arrives, Then no reminder is sent

---

## WW-03: Weight logging & trend

- **Actor:** signed-in user
- **Trigger:** weight screen (future design) or logging flow
- **Preconditions:** validated numeric weight (SAFE-01 boundaries)
- **Action:** enter current weight; optionally set/adjust target
- **Visible state:** current weight, target weight, history list, trend
  visualization with weekly/monthly views
- **Expected outcome:** each entry is timestamped; trend is computed over
  logged entries; weekly and monthly views are available. The UI avoids
  emphasizing daily fluctuations (copy and visuals must not alarm on normal
  ±0.5 kg day-to-day noise).
- **Failure outcome:** invalid input is rejected at entry; no entry is
  silently dropped
- **Edge cases:** back-filled historical entries keep their given dates;
  multiple same-day entries are allowed and the trend uses the appropriate
  aggregation
- **Acceptance examples:**
  - Given daily weights across a month, When the user opens the monthly view,
    Then a smoothed trend is shown rather than raw daily spikes
