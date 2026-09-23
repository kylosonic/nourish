# UAT checklist — Nourish MVP (`feat/nourish-mvp`)

For the human reviewer. **Nothing in this file has been executed by an agent:**
the checks below are what remains to be done by hand, and the project's rule is
that UAT is approved by a person, never inferred. A gate is only closed when its
result is written into `docs/swarm/STATE.md` with the date and the outcome.

The app is usable **fully offline and signed out**; every check marked *(API)*
needs the API running locally.

## 0. Prepare

```powershell
# Postgres + Redis
cd apps/api
docker compose up -d
Copy-Item .env.example .env      # set JWT_SECRET; keep SMS_PROVIDER=console
npm install
npx prisma migrate deploy
npm run import:fct:fixture
node dist/src/main.js            # or: npm run start:dev

# App
cd apps/mobile
flutter pub get
flutter run
```

With `SMS_PROVIDER=console` the sign-in code is written to the API's own log —
read it there. No real SMS gateway exists in this environment, and no AI
provider key exists either, so checks that would need one are marked
**EXPECTED LIMIT** rather than skipped silently.

## 1. Onboarding (ONB-01…09)

| # | Step | Expected |
| --- | --- | --- |
| 1.1 | Fresh install, launch | Welcome screen; no account, no network needed |
| 1.2 | Walk Language → Goal → Body → Activity → Food preference | Answers persist; killing the app mid-flow resumes at the first unanswered step (ONB-09) |
| 1.3 | Goal = "Lose weight" | The pace step appears; for other goals it is skipped (PPA-2) |
| 1.4 | Body inputs: age 17, height 90 cm, weight 20 kg | Each is refused with a message; nothing is stored (PPA-3 / SAFE-01) |
| 1.5 | Finish onboarding | Daily-target screen shows the engine's own kcal; START TRACKING opens Home |

## 2. Logging a meal (LOG-01/05, SCAN-04…07)

| # | Step | Expected |
| --- | --- | --- |
| 2.1 | Scan centre → "Describe a meal" → type "doro wot and injera" | Progress, then either a result or an honest low-confidence path *(API)* |
| 2.2 | With no AI key configured *(API)* | The run fails with a stated reason (`AI_UNAVAILABLE`); no invented food appears. **EXPECTED LIMIT** |
| 2.3 | Scan centre → "Take photo" *(API, device only)* | The system picker opens, the photo is downscaled and metadata-stripped before it leaves the app (SCAN-03). **EXPECTED LIMIT** in this environment: the picked image is exercised through a fake in tests, not on a device |
| 2.4 | TAKE PHOTO / USE VOICE / SCAN BARCODE from the scan sheet | Honest-void copy naming the missing design; no fake capture screen (SCAN-02 is deliberately not substituted) |
| 2.5 | Edit an item's portion before saving | Item totals recompute with the deterministic `per100g × grams / 100`; the saved meal keeps that snapshot |
| 2.6 | Search manually → add a food | Quick-add uses the catalog's default portion; the item can be edited then saved |

## 3. Home, targets, water, weight (HOME-01…05, TGT-01…04, WW-01, WW-03)

| # | Step | Expected |
| --- | --- | --- |
| 3.1 | Home after logging | Calories left, macro pills and the ring all reflect the target and today's meals |
| 3.2 | Add 250 ml twice, remove once | "0.25 / 3.0 L" then back down; remove floors at 0 and never goes negative |
| 3.3 | Adjust the daily water goal up twice | The goal moves a glass at a time, persists, and the day's logs are untouched |
| 3.4 | Push the goal to its maximum | The up control is disabled at the bound rather than silently ignoring taps |
| 3.5 | Weight card → log 68.5 kg | The entry appears in the summary and history; the dashboard card follows it |
| 3.6 | Log a weight, then re-open the app | History and trend survive a restart |
| 3.7 | Suggestion: enter 500 kcal / 35 g in "What can I eat" | Catalog foods that each fit 500 kcal, together covering ≥ 35 g protein; Ethiopian dishes ranked in |
| 3.8 | Enter 0 kcal in the same screen | "No calorie budget left" and no suggestions — never a nudge to eat less; with a floor-clamped target the copy says so specifically |

## 4. Insights (INS-01…03)

| # | Step | Expected |
| --- | --- | --- |
| 4.1 | Insights tab with nothing logged | Empty state inviting a log — not a zero-filled dashboard |
| 4.2 | Log meals on two days, one over target | Bars per logged day, over-target day flagged, dashed target line |
| 4.3 | Look at a day with no meals | Drawn as un-logged (no bar), not as a zero (P-INS-1) |
| 4.4 | Weigh in twice, a few days apart | A `Weight trend` highlight stating the move and the number of weigh-ins — neutral wording, no praise or warning |
| 4.5 | Open Insights from a cold start | The dashboard computes when the tab opens, not at launch |

## 5. Account, backup, restore (AUTH-01…03, OFF-02) *(API)*

| # | Step | Expected |
| --- | --- | --- |
| 5.1 | Profile tab while signed out | Explains that everything stays on the device, and how many changes are waiting |
| 5.2 | SIGN IN with e.g. `0911 23 45 67` | The server normalizes it; the next step names `+251911234567` |
| 5.3 | Enter a wrong six-digit code | The server's own message (including attempts left) is shown; no session is created |
| 5.4 | Enter the code from the API log | Signed in; the account screen shows number, plan, consent and device count |
| 5.5 | BACK UP NOW | Queued changes are sent; the panel reports how many, and the count returns to zero |
| 5.6 | Stop the API, log a meal, press BACK UP NOW | A stated failure; the change stays queued — nothing is lost or silently dropped |
| 5.7 | Restart the API, press BACK UP NOW again | The queued change is applied |
| 5.8 | Kill and relaunch the app | The session survives (tokens are in platform secure storage, not a file) |
| 5.9 | Stop the API, relaunch the app | "Signed in, not confirmed" — the app does not claim there is no account |
| 5.10 | SIGN OUT | The device is signed out even if the server is unreachable; the server session is ended when it is reachable |
| 5.11 | Confirm in the database that pushed rows exist (`SELECT` in `nourish-postgres`) | The meal (with its items), water and weight rows are present with the device's `dateKey` |
| 5.12 | **Restore onto a fresh install** | **NOT BUILT** — pull is not implemented; the account screen says the backup is one-way. This check must fail today by design |

## 6. Safety, privacy and honesty (SAFE-01, ADR-0005/0008)

| # | Step | Expected |
| --- | --- | --- |
| 6.1 | Inspect every value shown for a logged meal | It matches the FCT 2025 entry × grams; nothing is estimated |
| 6.2 | Airplane mode, whole app | Onboarding, logging, targets, insights, weight, water and recommendations all still work |
| 6.3 | Check the app's network calls | Only the catalog, analysis, auth/sync and release-metadata lanes talk to the network (`lib/data/sources/`) |
| 6.4 | Trigger every unbuilt lane (voice, barcode, camera screen, calendar, notifications, paywall) | Honest-void copy that names what is missing; no fake screen, no placeholder numbers |
| 6.5 | Confirm consent behaviour | The consent flag is whatever the server holds; the app never flips it locally |

## 7. Known gaps at this handoff (not defects)

- **Pull/restore is not built**: sync is a backup, not a sync (check 5.12).
- **Water reminders (WW-02)** and **entitlements/paywall (SUB-01)** are not
  built: P-WW-2 needs platform notification support that cannot be verified
  here, and SUB-01 has neither a design (P-SUB-1) nor a payment provider
  (P-PROV-1).
- **No AI provider key, no SMS gateway credential** exist here: recognition and
  real SMS delivery are implemented and unit-tested but have never run against a
  live provider.
- **The release pipeline has never run** (needs a remote and the secrets in
  `docs/release-process.md`); nothing is merged to `master`.
- Every provisional layout is listed as `PPA-1…PPA-16` in
  `docs/plans/provisional-product-assumptions.md`. If UAT overturns one, that row
  names the slice it reworks.

## 8. Recording the result

1. Walk the tables above on a device; note the exact step number and what
   happened for anything that deviates.
2. Record the outcome in `docs/swarm/STATE.md` (a UAT block: date, reviewer,
   approved / rejected, deviations with step numbers).
3. Only then may the branch be merged — `master` is still at the S0 release
   commit, and AGENTS.md §10 forbids merging without this approval.
