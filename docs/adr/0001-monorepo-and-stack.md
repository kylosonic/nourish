# ADR-0001: Clean Monorepo and Technology Stack

- **Status:** Accepted
- **Date:** 2026-08-26
- **Deciders:** @architect (per master engineering prompt §5–§6)

## Context

The Nourish master prompt specifies both a technology stack (§5) and a
recommended clean monorepo layout (§6). The product spans a Flutter mobile
app, a NestJS API, an admin tool, and a marketing website, with shared
domain/validation/design concerns across all of them. A single repository with
clear application/package separation supports the vertical-slice delivery plan
(ADR-0002) because each slice touches a predictable subset of the tree.

## Decision

Adopt a clean monorepo with the following layout:

```
/apps/mobile          Flutter + Dart + Riverpod + GoRouter
/apps/api             NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ
/apps/admin           Admin tooling (deferred beyond MVP except corrections review)
/apps/website         Marketing site + dynamic download UX
/packages/shared      Shared utilities
/packages/design-system
/packages/api-client  Typed API client
/packages/domain      Domain models/constants
/packages/validation  Runtime schema validation
/design               Stitch design source of truth
/docs                 behaviors, ADRs, plans, swarm state
/.github/workflows    CI/CD (GitHub Actions)
```

Technology stack is fixed exactly per master prompt §5:

- **Mobile:** Flutter, Dart, Riverpod, GoRouter, local persistent database,
  secure storage.
- **Backend:** NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ (or
  equivalent job queue).
- **Storage:** Cloudflare R2.
- **Search:** PostgreSQL initially; migration path to Typesense/OpenSearch kept
  open.
- **Observability:** Sentry, structured logs, analytics.
- **CI/CD:** GitHub Actions.

## Alternatives Considered

- **Polyrepo (one repo per app):** rejected — cross-package contract
  drift and duplicated CI; the MVP moves too fast for repo-boundary overhead.
- **Single mobile-first repo with backend folders:** rejected — no clean seam
  for shared packages, and the master prompt names the layout explicitly.
- **Different frameworks (React Native, Express, etc.):** rejected — the
  master prompt pins the stack; no evidence justifies deviation.

## Consequences

- Each app/package has isolated ownership, which matches the swarm's
  parallelism rule (non-overlapping file ownership).
- **Shared packages are scaffolded lazily per slice** — only what a slice
  needs exists at first. S0 (local-only mobile) may exist with no
  `/apps/api` or shared packages yet; they appear when S1/S2 need them.
  Agents must not assume a package exists just because ADR-0001 names it.
- One branch (`feat/nourish-mvp`) covers the whole batch; changes stay
  atomic per slice.
- TypeScript/Flutter lint and format tooling is configured once at root and
  enforced in CI.

## Migration / Rollback

Not applicable — greenfield decision. Reverting later to a polyrepo would
require history surgery; treat as irreversible without explicit @architect
approval.
