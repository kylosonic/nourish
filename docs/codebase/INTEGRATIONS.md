# External Integrations

## Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| Nourish API | HTTP JSON | Catalog, analysis, auth, sync | Public reads; bearer access token for sync; rotating refresh token | High | `apps/mobile-rn/src/data/api.ts` |
| Google Identity | OAuth/OIDC | Google account sign-up/sign-in | Mobile OAuth client IDs; server verifies ID token audience/signature | High when enabled | `SignInScreen.tsx`, `google-verifier.ts` |
| OpenAI-compatible provider | HTTPS JSON | Meal photo/text proposals | API key from environment | High for automatic recognition | `openai-compatible.provider.ts`, `ai-provider.factory.ts` |
| PostgreSQL | Database | Accounts, sessions, FCT foods, analyses, sync mirror | Connection string | High | `prisma/schema.prisma`, `docker-compose.yml` |
| SMS gateway | HTTP | Optional phone OTP | API key from environment | Medium | `sms.providers.ts`, `sms-provider.factory.ts` |
| Sentry | Error monitoring | API telemetry | Optional DSN | Low/optional | `apps/api/src/main.ts`, `config/env.ts` |
| GitHub Releases | Artifact hosting | APK/IPA downloads | GitHub Actions `contents: write` | High for distribution | `.github/workflows/react-native-artifacts.yml` |

## Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| PostgreSQL | Canonical API persistence | Prisma | Migration and backup responsibility | `apps/api/prisma/` |
| AsyncStorage + AES-GCM | Encrypted local app data on native | `apps/mobile-rn/src/state/storage.ts` | Plain fallback on web is intentional for non-secret app data | `storage.ts` |
| SecureStore | Refresh credentials and local data key | `storage.ts` | Native-only session persistence | `storage.ts` |
| GitHub Actions artifacts | Build outputs | Workflow upload/download | Artifact retention | `react-native-artifacts.yml` |

## Secrets and Credentials

- API secrets are read from environment variables; `.env.example` contains placeholders only.
- GitHub release workflow uses repository variables for public API/Google client IDs, not committed values.
- Android release APK is signed with the build-generated development/debug key in the current workflow, not a production keystore.
- Google and AI live credentials are currently absent from this workspace and GitHub repository configuration.

## Reliability and Failure Behavior

- Mobile HTTP requests have 15–60 second timeouts depending on operation.
- Analysis provider failures produce explicit 5xx responses; no canned result is substituted outside the non-production fixture.
- Scanner failure UI offers manual food search, retry, and cancel.
- Sync detects 401, refreshes once, then retries the queued changes.
- API boot fails fast when required environment values are missing.

## Observability

- Structured API logging exists under `apps/api/src/common/logger/`.
- Sentry is DSN-gated and disabled when unset.
- No mobile crash reporting or analytics provider is configured.
- No metrics/tracing backend is configured.

## Evidence

- `apps/mobile-rn/src/data/api.ts`
- `apps/api/src/auth/google-verifier.ts`
- `apps/api/src/ai/openai-compatible.provider.ts`
- `apps/api/.env.example`
- `apps/mobile-rn/.env.example`
- `.github/workflows/react-native-artifacts.yml`
