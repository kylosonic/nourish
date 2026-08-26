# CONTEXT — Nourish

Project context anchor for every agent in the Nourish engineering swarm.
Read this before touching any artifact. This file records **what the product
is**; implementation rules live in `AGENTS.md` and the behavior contracts.

## Product

**Nourish** is an AI-powered nutrition and calorie-tracking platform built for
Ethiopian food, architected for international expansion.

- **Tagline:** "Nutrition, understood."
- **Canonical domain:** `nourish.app` (subdomains: `app.`, `api.`,
  `downloads.`, `admin.`).
- **Signature capability:** take a picture of a meal → identify the foods →
  estimate portions → calculate nutrition → confirm/edit → save → update daily
  nutrition targets.
- **Visual source of truth:** `Design/nourish/DESIGN.md` and the Stitch screens.
  Do not redesign the interface unless explicitly instructed.
- **Master specification:** `Nourish — Master Application Engineering Prompt.md`
  (root).

## Primary Product Loop

`photo → identify → portions → nutrition → confirm → save → update targets`

Full loop: Home → Scan Meal → Camera → AI Analysis → Food Detection →
Ethiopian Food Retrieval → Portion Estimation → Nutrition Calculation → User
Confirmation → Meal Saved → Dashboard Updated → Insights.

This is the fastest, most polished flow in the app. The AI never plays the
role of final calculator; nutrition and targets are deterministic engines.

## Domain Vocabulary

| Term | Meaning |
| --- | --- |
| **Canonical food** | The single normalized food record every name, alias, transliteration, and misspelling resolves to (e.g., "doro wot" / "doro wet" / "ዶሮ ወጥ" → one food). |
| **Food layer** | The normalized application food layer above raw source data; holds aliases, transliterations, category, preparation, region, provenance, verification, confidence, status. |
| **Portion engine** | Deterministic conversion of user/AI portions into grams; conversions live in the database per food, never hardcoded in prompts. |
| **Nutrition snapshot** | The nutrition values captured at logging time and stored with the meal item; history is immutable to later food-database changes. |
| **Meal slot** | The standard meal grouping: Breakfast / Lunch / Dinner / Snack / Other (Snack/Other provisional — see ADR-0003). |
| **Analysis run** | One AI analysis of a photo/text/voice input: vision → retrieval → normalization → portion → nutrition → confidence, all schema-validated JSON. |
| **Confidence state** | `High` / `Medium` / `Low`, both per-item and overall; Low triggers the low-confidence resolution flow. |
| **Corrections capture** | Every user correction of AI output (prediction vs. choice, food, portion, model/prompt versions, timestamp) recorded for quality analytics; never personal identity. |

## Tech Stack

Per master prompt §5:

- **Mobile:** Flutter, Dart, Riverpod, GoRouter, local persistent database,
  secure storage.
- **Backend:** NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ (or
  equivalent job queue).
- **Storage:** Cloudflare R2.
- **Search:** PostgreSQL initially; architecture must permit migration to
  Typesense/OpenSearch later.
- **Observability:** Sentry, structured logs, analytics.
- **CI/CD:** GitHub Actions.

## Monorepo Layout

Per ADR-0001:

```
/apps/mobile          Flutter app
/apps/api             NestJS backend
/apps/admin           Admin tooling (deferred beyond MVP except corrections review queue)
/apps/website         Marketing site + download UX
/packages/shared
/packages/design-system
/packages/api-client
/packages/domain
/packages/validation
/design               Stitch design source of truth
/docs                 behaviors, ADRs, plans, swarm state
/.github/workflows    CI/CD
```

Shared packages are scaffolded lazily per slice — only what a slice needs
exists at first.

## Where the Rules Live

- **Product behavior (what the product must do):** `docs/behaviors/*` — the
  source of truth. Behavior IDs: ONB-, AUTH-, HOME-, SCAN-, LOG-, TGT-, INS-,
  WW-, SAFE-, SUB-, OFF-, REL-. Unresolved items are in
  `docs/behaviors/pending-behaviors.md` (P-* IDs) and must never be silently
  resolved.
- **Decision history:** `docs/adr/*` — architecture decision records
  (0001 monorepo/stack, 0002 vertical slices, 0003 nav shell, 0004 data
  semantics, 0005 honest voids).
- **Execution:** `docs/plans/execution-contract.md` and per-slice blueprints.
- **Orchestration state:** `docs/swarm/STATE.md`.

## Non-Negotiable Rules (carried into every slice)

1. Never present AI nutrition estimates as exact (the "~" affordance).
2. Never let the AI compute final nutrition, targets, or decide entitlements.
3. Never invent nutrition for packaged products or missing foods.
4. Never present an unsigned IPA as installable.
5. Never silently use user data for model training (consent-gated).
6. Nutrition snapshots make history immutable to database changes.
7. All AI output is schema-validated; malformed output is rejected.
8. No fake functionality, no dead buttons (master §71) — see ADR-0005 for the
   per-slice honest-voids pattern.
