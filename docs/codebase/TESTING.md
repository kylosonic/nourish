# Testing Patterns

## Test Stack and Commands

- React Native: Vitest 5.0, run with `npm test` in `apps/mobile-rn`.
- API: Jest/ts-jest 29.x, run with `npm test` for non-database specs.
- API HTTP/e2e: `npm run test:e2e`; requires PostgreSQL and application bootstrapping.
- Expo build diagnostics: `npx expo install --check`, `npx expo-doctor`, `npx expo export --platform web`.

## Test Layout

- React Native domain tests live beside the domain folder in `apps/mobile-rn/src/domain/domain.test.ts`.
- API tests live in `apps/api/test/`; unit files use `.spec.ts`, HTTP suites use `.e2e-spec.ts`.
- API e2e setup: `apps/api/test/setup.ts`, `db-utils.ts`, `env.setup.ts`, and `jest-e2e.json`.
- AI tests use `apps/api/src/ai/fixture.provider.ts`.

## Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Mobile unit/domain | Yes | Nutrition, insights, recommendations | 11 tests currently discovered |
| API unit | Yes | Auth crypto/password, validation, imports, pipelines, sync merge | Uses ts-jest |
| API HTTP/e2e | Yes, with PostgreSQL | Auth, catalog, foods, analysis, sync, security | Docker daemon was unavailable during this review |
| Mobile component/e2e | No automated suite found | Screens and gestures | Manual browser preview used |
| Real Google OAuth | No | Google account linking | Requires client IDs and live account |
| Real AI provider | No | Photo/text recognition | Requires deployed API and provider key |

## Mocking and Isolation

- Provider seams are injected through NestJS tokens and replaced with fixture implementations.
- E2E database tests use shared PostgreSQL test infrastructure and cleanup utilities.
- Mobile pure-domain tests avoid React Native native modules by testing plain functions.
- Network behavior is not comprehensively mocked for mobile API mapping.

## Coverage and Quality Signals

- No explicit coverage threshold is configured.
- Jest coverage collection is limited to imports and foods source patterns in `apps/api/jest.config.js`.
- Expo Doctor currently reports dependency alignment that must remain clean before release.
- There is no automated visual regression suite.

## Evidence

- `apps/mobile-rn/package.json`
- `apps/mobile-rn/src/domain/domain.test.ts`
- `apps/api/package.json`
- `apps/api/jest.config.js`
- `apps/api/test/jest-e2e.json`
- `apps/api/test/password.spec.ts`
