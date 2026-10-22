# Coding Conventions

## Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| React components | PascalCase file and export | `SignInScreen.tsx` | `apps/mobile-rn/src/screens/auth/SignInScreen.tsx` |
| React helpers | camelCase | `setPendingAnalysisInput` | `apps/mobile-rn/src/state/analysisSession.ts` |
| API files | kebab-case | `google-verifier.ts` | `apps/api/src/auth/` |
| API services/repositories | PascalCase class names | `AuthService`, `AnalysisRepository` | `apps/api/src/auth/`, `apps/api/src/analysis/` |
| Environment variables | UPPER_SNAKE_CASE | `EXPO_PUBLIC_API_URL` | `apps/mobile-rn/.env.example` |

## Formatting and Linting

- React Native: Expo ESLint flat config; TypeScript strict mode.
- API: ESLint typed TypeScript rules and TypeScript strict mode with unused-symbol checks.
- Commands: `npm run lint`, `npm run typecheck`, `npm test`.
- Evidence: `apps/mobile-rn/eslint.config.js`, `apps/mobile-rn/tsconfig.json`, `apps/api/eslint.config.mjs`, `apps/api/tsconfig.json`.

## Import and Module Conventions

- Imports are grouped from framework libraries, React Native, third-party modules, then local modules.
- React Native uses relative local imports rather than path aliases.
- API modules expose controllers, services, repositories, and provider tokens through NestJS modules.
- Public API payloads are typed DTOs; wire mapping is kept in `src/data/api.ts`.

## Error and Logging Conventions

- API failures use `NourishHttpException` with stable `ErrorCode` values and JSON error envelopes.
- External provider failures are translated into explicit unavailable, timeout, invalid-output, or upstream errors.
- Mobile network failures become user-facing `ApiError` messages and preserve offline local data.
- API logs are structured for key events; credentials and raw provider bodies must not be logged.
- Evidence: `apps/api/src/common/error/`, `apps/api/src/common/logger/`, `apps/mobile-rn/src/data/api.ts`.

## Testing Conventions

- Mobile pure-domain tests are in `apps/mobile-rn/src/domain/domain.test.ts` and use Vitest.
- API unit tests are in `apps/api/test/*.spec.ts`; e2e tests use the `*.e2e-spec.ts` suffix.
- External AI behavior is tested through a fixture provider; database e2e tests require PostgreSQL.
- No coverage threshold is configured in either manifest.

## Evidence

- `apps/mobile-rn/eslint.config.js`
- `apps/api/eslint.config.mjs`
- `apps/api/test/jest-e2e.json`
- `apps/mobile-rn/src/data/api.ts`
- `apps/api/src/common/error/error-envelope.ts`
