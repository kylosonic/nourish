# Nourish — Behavior Contracts

Product behavior authority: `@vision`
Consumer: `@architect`

## Purpose

This directory defines **what the product must do from the user's perspective**.
It intentionally contains no implementation detail — no database, framework, or
service names. The architect maps these contracts onto the technical design.

## Sources

Behaviors in this directory are derived from three artifacts:

| Source | Path |
| --- | --- |
| Master engineering prompt | `Nourish — Master Application Engineering Prompt.md` (root) |
| Design system | `Design/nourish/DESIGN.md` |
| Stitch screens | `Design/<screen>/code.html` + `screen.png` |
| Release workflow | `Nourish — GitHub Actions Mobile Release Workflow.md` (root) |

Every behavior cites its source so the architect can trace the reasoning.

## Contract format

Each behavior is written as:

- **Actor** — who performs it
- **Trigger** — what starts it
- **Preconditions** — what must already be true
- **Action** — what the actor does
- **Visible state** — what the actor sees along the way
- **Expected outcome** — the guaranteed result
- **Failure outcome** — what happens when it cannot succeed
- **Edge cases** — special situations that must not be ignored
- **Acceptance examples** — concrete Given/When/Then checks

## File index

| File | Behavior IDs | Covers |
| --- | --- | --- |
| `onboarding.md` | ONB- | Welcome, language, goal, body info, activity, pace, food preference, daily target |
| `auth-session.md` | AUTH- | Phone + OTP sign-in, tokens, sessions, account states |
| `home-dashboard.md` | HOME- | Home screen, calorie ring, macros, meals, hydration, app navigation shell |
| `scan-analysis.md` | SCAN- | Scan menu, camera capture, AI analysis, result screen, low confidence, edit/confirm |
| `logging-methods.md` | LOG- | Text, voice, barcode, OCR, food search, meal history |
| `targets-nutrition.md` | TGT- | Calorie target engine, portion engine, nutrition engine, nutrition snapshots |
| `insights-recommendations.md` | INS- | Weekly insights, highlights, diversity, recommendations |
| `water-weight.md` | WW- | Water tracking, weight tracking |
| `safety-privacy-consent.md` | SAFE- | Health safety, privacy, data rights, AI improvement consent, corrections |
| `subscriptions-payments.md` | SUB- | Plans, entitlements, payments |
| `offline-sync.md` | OFF- | Offline behavior and reconnection sync |
| `release-download-update.md` | REL- | Website download UX, release metadata, in-app update checks |
| `pending-behaviors.md` | — | Undesigned / unresolved rules and open questions for the architect |

## Rules of engagement

1. The Stitch design is the visual source of truth. These contracts record what
   the design *shows*; where the design is silent, the master prompt rules.
2. Anything the design contradicts or does not cover is listed in
   `pending-behaviors.md`, never silently resolved here.
3. Behaviors are testable. Acceptance examples must be checkable without
   reading code.
