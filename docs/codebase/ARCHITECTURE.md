# Architecture

## Architectural Style

Nourish is an offline-first client with a feature-oriented mobile UI and a layered NestJS API. Nutrition values are deterministic: AI proposes food labels and portions, but the API resolves canonical foods and computes nutrition from FCT-derived per-100g data.

Primary constraints:

- No fake recognition or invented nutrition when a provider or food is unavailable.
- Local logging and search remain usable without an API.
- Server sync is a mirror, not the only copy of user data.

## System Flow

```text
React Native screen
  -> local app state / encrypted persistence / offline queue
  -> POST /v1/analyses (photo or text)
  -> AI provider proposes foods and portions
  -> canonical food resolution + deterministic nutrition
  -> confidence gate
  -> review screen -> local meal save -> optional sync
```

For authentication:

```text
email/password, Google ID token, or phone OTP
  -> NestJS AuthService
  -> normalized identity and provider linking
  -> rotating refresh token + short-lived access token
  -> SecureStore-backed mobile session
```

## Layer Responsibilities

| Layer | Owns | Must not own | Evidence |
|-------|------|--------------|----------|
| Navigation/screens | Presentation and user choices | Nutrition calculation | `apps/mobile-rn/src/screens/`, `src/navigation/RootNavigator.tsx` |
| Mobile state | Hydration, local writes, queue, session persistence | Provider recognition | `apps/mobile-rn/src/state/AppProvider.tsx`, `storage.ts` |
| API analysis | Validation, AI adapter, resolution, nutrition, confidence | Direct UI concerns | `apps/api/src/analysis/` |
| API auth | Identity, password hashing, Google verification, token rotation | Client credential storage | `apps/api/src/auth/` |
| API sync | Idempotent writes and tombstones | User interface policy | `apps/api/src/sync/` |
| Prisma | Persistence and relational constraints | Business rules | `apps/api/prisma/schema.prisma` |

## Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Adapter/Factory | `apps/api/src/ai/ai-provider.factory.ts` | Select fixture, OpenAI-compatible, or unavailable provider from configuration |
| Repository | API feature modules | Isolate persistence from service rules |
| Dependency injection | NestJS modules/controllers/services | Replaceable providers and test seams |
| Reducer/context | `apps/mobile-rn/src/state/AppProvider.tsx` | Deterministic local state transitions and queue creation |
| Queue mirror | Mobile `queue` plus `/v1/sync` | Offline writes and idempotent retry |

## Known Architectural Risks

- The mobile release defaults to `https://api.nourish.app`, but no deployed API URL is currently configured in the repository, so cloud recognition and email/Google account calls cannot work in that artifact.
- API analysis budget and rate state are process-local; horizontal scaling changes the effective production ceiling.
- The active client is `apps/mobile-rn`; release and UX changes should target that app.
- Google and AI credentials are intentionally absent; production flows remain unverified against real external services.

## Evidence

- `apps/mobile-rn/src/state/AppProvider.tsx`
- `apps/mobile-rn/src/data/api.ts`
- `apps/api/src/analysis/analysis.service.ts`
- `apps/api/src/ai/ai-provider.factory.ts`
- `apps/api/src/auth/auth.service.ts`
- `docs/adr/0007-ai-pipeline-and-provider-seam.md`
