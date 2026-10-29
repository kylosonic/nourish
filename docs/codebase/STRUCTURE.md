# Codebase Structure

## Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `apps/mobile-rn/` | Active React Native MVP | `README.md`, `apps/mobile-rn/App.tsx` |
| `apps/api/` | NestJS API, Prisma schema, migrations, fixtures, and tests | `apps/api/package.json`, `apps/api/prisma/schema.prisma` |
| `apps/website/` | Static marketing and release-download site | `apps/website/index.html`, `apps/website/assets/app.js` |
| `Design/` | Visual source screens and design specification | `Design/nourish/DESIGN.md`, `Design/*/screen.png` |
| `docs/` | Product behaviours, ADRs, plans, release process, and state | `docs/behaviors/`, `docs/adr/`, `docs/release-process.md` |
| `.github/workflows/` | React Native, API, and website CI and release workflows | `.github/workflows/` |

## Entry Points

- React Native runtime: `apps/mobile-rn/index.ts` registers `apps/mobile-rn/App.tsx`.
- React Native navigation: `apps/mobile-rn/src/navigation/RootNavigator.tsx`.
- API runtime: `apps/api/src/main.ts`.
- API module graph: `apps/api/src/app.module.ts`.
- Database migrations: `apps/api/prisma/migrations/`.
- Release build: `.github/workflows/react-native-artifacts.yml`.

## Module Boundaries

| Boundary | Responsibility | Must not contain |
|----------|----------------|------------------|
| `apps/mobile-rn/src/screens` | Screen composition and user interaction | Deterministic nutrition formulas |
| `apps/mobile-rn/src/domain` | Nutrition, insights, and recommendation logic | React Native UI or network calls |
| `apps/mobile-rn/src/data` | HTTP wire mapping and bundled food images | Screen state |
| `apps/mobile-rn/src/state` | Persisted app state, session, encryption, sync queue | Server-authoritative nutrition calculation |
| `apps/api/src/analysis` | Input validation, provider orchestration, resolution, deterministic nutrition, confidence | AI-generated final nutrition |
| `apps/api/src/auth` | Accounts, password/Google/phone identity, tokens, sessions | UI presentation |
| `apps/api/src/foods` and `src/imports` | FCT catalog import and read models | User-specific state |
| `apps/api/src/sync` | Idempotent server mirror of meal/water/weight changes | Canonical mobile storage |

## Naming and Organization

- React Native components use PascalCase files; domain, state, and utility files use camelCase.
- API source uses kebab-case filenames and PascalCase classes.
- API routing is feature-module based with controller/service/repository boundaries.
- React Native uses relative imports under `src/`.
- Database model names and API DTOs are explicit in `prisma/schema.prisma` and `src/**/dto`.

## Evidence

- `apps/mobile-rn/index.ts`
- `apps/mobile-rn/src/navigation/RootNavigator.tsx`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/prisma/schema.prisma`
