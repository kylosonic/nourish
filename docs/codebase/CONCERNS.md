# Codebase Concerns

## Top Risks

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | No reachable production API URL is configured | `.github/workflows/react-native-artifacts.yml`, `apps/mobile-rn/src/data/api.ts` | Released build cannot perform automatic photo/text analysis or cloud email/Google auth | Deploy API and set `NOURISH_API_URL` |
| High | No Google OAuth client IDs are configured | `.github/workflows/react-native-artifacts.yml`, `.env.example` files | Google button cannot start a working OAuth flow in the release | Configure Google Cloud clients and repository variables |
| High | No live AI key/provider is configured | `apps/api/src/config/env.ts`, `apps/api/.env.example` | Automatic scanner path returns AI unavailable; only manual fallback works | Configure `AI_PROVIDER`, base URL, and provider key |
| Medium | iOS artifact is unsigned | `.github/workflows/react-native-artifacts.yml` | IPA cannot be installed on a normal iPhone | Sign with Apple distribution credentials |
| Medium | Android artifact uses development signing | `.github/workflows/react-native-artifacts.yml` | APK is installable for testing but not Play Store-ready | Provision production keystore and secure signing workflow |
| Medium | Real external auth and AI calls are not live-tested | `docs/swarm/STATE.md`, API env examples | Contract drift could appear only in production | Run staging smoke tests with real credentials |

## Technical Debt

| Item | Why it exists | Where | Risk if ignored | Suggested fix |
|------|---------------|-------|-----------------|---------------|
| No server-side restore into mobile | Existing account work is backup-focused | `apps/mobile-rn/src/state/` | New device cannot restore complete local history | Add restore merge flow and conflict tests |
| No production API deployment manifest | Local Docker workflow only | `apps/api/docker-compose.yml`, `Dockerfile` | No reproducible cloud launch | Add provider-specific deployment configuration |
| No coverage thresholds | Test commands exist without coverage gates | `apps/api/jest.config.js`, mobile package scripts | Regressions can pass CI unnoticed | Set baseline coverage and enforce in CI |

## Security Concerns

| Risk | Category | Evidence | Current mitigation | Gap |
|------|----------|----------|--------------------|-----|
| Password authentication abuse | A07 Identification/Auth failures | `apps/api/src/auth/auth.controller.ts` | Rate limit, scrypt hashing, constant-time verification, dummy-hash login path | No account lockout/risk analytics |
| Refresh-token replay | A07 Identification/Auth failures | `apps/api/src/auth/auth.service.ts` | Hashed tokens, rotation, family revocation | Live security telemetry absent |
| Secret leakage | A02 Cryptographic failures | `.env.example`, workflow | Secrets not committed; env-based loading | No centralized secret manager shown |
| Google identity token misuse | A07 Identification/Auth failures | `apps/api/src/auth/google-verifier.ts` | Signature and audience verification; verified email required | Live Google integration untested |
| Provider output injection/invalid data | A03 Injection | `apps/api/src/ai/ai-response.validator.ts` | Schema validation and deterministic downstream calculation | Real-provider adversarial evaluation absent |

## Performance and Scaling

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|--------------|-----------------------|
| Analysis budget is process-local | `apps/api/src/analysis/analysis.service.ts` | Single instance behaves as designed | Multiple replicas multiply effective budget | Use Redis/PostgreSQL atomic counter |
| Sequential candidate resolution | `analysis.service.ts` loops over foods with `await` | Small fixture tests hide latency | Many foods increase response time | Parallelize with bounded concurrency after checking DB load |
| API e2e tests require PostgreSQL | `apps/api/test/setup.ts` | Docker daemon unavailable locally | CI/release confidence depends on service startup | Keep CI database health gate explicit |

## Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|--------------|----------------------|
| `docs/swarm/STATE.md` | Frequent manual evidence ledger | 36 commits in scan window | Update only with verified evidence |
| React Native screens/navigation | `RootNavigator.tsx` owns onboarding and screen transitions | Changes span the navigator and app screens | Keep changes within the active app and verify on both platforms |
| API workflow configuration | Prior release workflow fixes were numerous | Multiple `.github/workflows/api-ci.yml` commits | Validate YAML and run branch workflow |
| Release packaging | Signing/platform changes | Recent release commits | Build artifacts in Actions and verify file signatures/checksums |

## [ASK USER]

1. [ASK USER] What production API base URL should be embedded in the release, and where should the NestJS API be deployed?
2. [ASK USER] Which Google Cloud project/client IDs should be used for Android, iOS, and web?
3. [ASK USER] Should `v1.2.0` be published as a preview because the IPA is unsigned and the APK uses development signing?
5. [ASK USER] Is product sign-off available for the provisional screens and behavior assumptions recorded in `docs/plans/provisional-product-assumptions.md`?

## Evidence

- `docs/codebase/.codebase-scan.txt`
- `.github/workflows/react-native-artifacts.yml`
- `apps/api/src/analysis/analysis.service.ts`
- `apps/api/src/auth/`
- `apps/mobile-rn/src/data/api.ts`
- `docs/swarm/STATE.md`
