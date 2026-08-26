# Insights & Recommendations Behaviors (INS)

Sources: `Design/insights_dashboard`, Master §24–§25.

Insights must be derived from actual user data. Generic AI motivational
content is forbidden.

---

## INS-01: Weekly insights dashboard

- **Actor:** signed-in user
- **Trigger:** Insights tab selected
- **Preconditions:** at least some logged days (empty states otherwise)
- **Action:** view
- **Visible state:** title "Weekly Insights" with sub-copy "Here is a
  breakdown of your nutrition over the past 7 days."; cards:
  **Caloric Balance** chart (last 7 days, daily bars, dashed target line,
  over-target days in a distinct warning color); **Macro Averages**
  (protein/carbs/fat averages vs. targets as percentages and g values);
  **Highlights** (positive and cautionary data-driven findings);
  **Dietary Diversity** (share of cuisine types, e.g., Ethiopian vs.
  International)
- **Expected outcome:** every figure aggregates the user's logged meals for
  the trailing 7 days. The chart's target line equals the user's daily target
  (TGT-01). Averages use the same targets. Diversity derives from food
  categorization of logged items.
- **Failure outcome:**
  - No data for the window → empty state inviting the user to log, never a
    zero-filled fake dashboard
  - Partial window (e.g., day 2 of use) → the dashboard shows the days that
    exist and labels the window honestly
- **Edge cases:** days with no logging count as zero-consumption days and must
  be visibly distinguished from un-logged days in the underlying data model
  (a decision the architect must not paper over — see P-INS-1)
- **Acceptance examples:**
  - Given 7 logged days where Friday exceeded the target, When the user opens
    Insights, Then Friday's bar appears in the warning color and all other
    bars in the standard color
  - Given a brand-new account with no meals, When the user opens Insights,
    Then an empty state appears instead of a zeroed dashboard

---

## INS-02: Highlight generation

- **Actor:** backend (system rule)
- **Trigger:** insights dashboard load
- **Preconditions:** trailing-7-day meal data
- **Action:** system derives highlights
- **Visible state:** positive highlights (e.g., "Consistent Fiber — you met
  your fiber goal 6 out of 7 days") and cautionary ones (e.g., "Sodium Intake
  — sodium levels were 15% higher than recommended on Friday")
- **Expected outcome:** highlights are computed from real data patterns
  (fiber goal attainment, sodium thresholds, logging consistency, weight
  trend, water consistency). They cite the specific day or stat. No
  template-only motivational filler.
- **Failure outcome:** insufficient data → the Highlights card shows fewer or
  no items rather than generic praise
- **Acceptance examples:**
  - Given sodium 15% above the recommended level on Friday, When Insights
    loads, Then a cautionary highlight naming Friday appears
  - Given a user who has never exceeded fiber goals, When Insights loads,
    Then no "you're doing great at fiber" generic message appears unless data
    supports a specific claim

---

## INS-03: Recommendation requests ("What can I eat")

- **Actor:** signed-in user
- **Trigger:** user asks what fits their remaining budget (design screen not
  produced — P-INS-2)
- **Preconditions:** active daily target; remaining calories/macros known
- **Action:** user states the request (e.g., "I have 500 calories left and
  need 35g protein")
- **Visible state:** request entry + ranked suggestions (pending design)
- **Expected outcome:** suggestions are drawn from the food database,
  constrained by remaining calories, remaining macros, user food preference
  (ONB-07), meal time, and user history. Results prioritize Ethiopian/local
  foods that fit the constraints.
- **Failure outcome:** no food fits the constraints → say so and suggest the
  closest alternatives with the gap explained, rather than fabricating items
- **Edge cases:** recommendations respect safety rules (SAFE-01) — a user on
  a minimum-safe target is never nudged below it
- **Acceptance examples:**
  - Given 500 kcal remaining and a 35 g protein need, When the user requests
    suggestions, Then returned foods each fit within 500 kcal and collectively
    can meet the protein need, and Ethiopian foods rank among the results
