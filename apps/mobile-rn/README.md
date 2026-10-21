# Nourish React Native

The active Nourish mobile client, rebuilt with Expo SDK 58, React Native 0.88,
TypeScript, React Navigation, and a local-first data model.

The visual source is `../../Design/nourish/DESIGN.md` and the 16 approved
Stitch screens in `../../Design/`. The Flutter client in `../mobile` remains in
the repository as a verified legacy reference while backend and product
contracts continue to be shared.

## What is implemented

| Area | State |
| --- | --- |
| Welcome and eight-step onboarding | Implemented against the approved screens |
| Deterministic Mifflin-St Jeor target engine | Implemented locally with the reviewed safety input bounds |
| Home dashboard | Implemented with calorie ring, macros, meals, hydration, and recommendation entry |
| Photo/gallery scan | Implemented through the real `POST /v1/analyses` endpoint |
| Analysis progress, failure, result, low confidence | Implemented without synthetic result fallbacks |
| Edit-before-save | Implemented with live deterministic nutrition recalculation |
| Text meal logging | Implemented through the API, with editable results before save |
| Food search/quick add | Implemented against the cached catalog with English and Amharic aliases |
| Meal history | Implemented with daily totals and immutable item snapshots |
| Weekly insights | Implemented from actual logged meals and weigh-ins |
| Water and weight | Implemented with local persistence and a reviewable sync queue |
| Recommendations | Implemented as a deterministic budget/protein/preference ranking |
| Phone + OTP account flow | Implemented with secure on-device token storage |
| Local health-data storage | Encrypted AES-256-GCM blob; key held in platform secure storage |
| Push-only backup | Implemented against `/v1/auth` and `/v1/sync`, including token rotation on a 401 |
| Release update check | Implemented against `latest.json` using semantic version comparison |
| Data export | Implemented as a shareable JSON file |

## Honest environment limits

These are product/provider blockers, not hidden stubs:

- The API must be running and have a configured `AI_PROVIDER` for photo or text
  recognition. Without a provider, the analysis screen shows a retryable,
  plain-language failure and saves nothing.
- SMS delivery requires an API `SMS_PROVIDER`. The local API supports its
  development console provider, but no production SMS gateway credential is in
  this workspace.
- Voice transcription requires a speech provider. The voice lane routes to the
  transcript editor and states that live transcription is not configured.
- Barcode lookup and label OCR require a verified product catalog/service.
  Unknown barcodes never receive estimated packaged nutrition.
- Platform reminder scheduling is not configured, so the setting is visibly
  disabled instead of being a dead control.
- Server-side account erasure is not present in the current API. The app offers
  local deletion and identifies the remaining server-side blocker in Privacy.
- EAS signing/store publication requires an Expo account, Apple team, and
  Android signing credentials. Those cannot be manufactured locally.

## Run

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

For a local API:

```powershell
# Start the NestJS API according to ../api/README.md first.
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
npm start
```

Android emulators cannot reach the host through `localhost`; use the default
development URL `http://10.0.2.2:3000` or set `EXPO_PUBLIC_API_URL` explicitly.

## Verify

```powershell
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform web
```

## Native release

The app uses EAS profiles in `eas.json`.

1. Run `npx eas-cli@latest login`.
2. Run `npx eas-cli@latest init` to link the EAS project and add its project ID.
3. Configure signing through EAS credentials.
4. Set `EXPO_TOKEN` as a GitHub Actions secret.
5. Run the **React Native EAS Release** workflow.

No keystore, Apple private key, API key, or OTP code belongs in this repository.

### Unsigned CI artifacts

`.github/workflows/react-native-artifacts.yml` produces two directly downloadable
GitHub release assets without EAS credentials:

- `Nourish-1.1.0.apk` — release-mode Android APK signed with the generated
  development debug key; installable for testing.
- `Nourish-1.1.0-UNSIGNED.ipa` — an unsigned iOS payload archive for
  inspection and signing work; **not installable on a standard iPhone**.

The workflow writes `SHA256SUMS.txt` and creates the requested GitHub release
only after both builds succeed.

## Dependency audit note

`npm audit` reports 15 high-severity advisories inherited from Expo's
Metro/build toolchain (`braces` and `node-forge` transitively, plus packages
that depend on them). Both named upstream packages are already at the latest
versions published to npm, and npm's proposed automatic remediation is an
unsupported downgrade to Expo 44. Re-run the audit when Expo ships patched
transitive dependencies. No advisory in this set is app source code, and no
credential or user data is present in the repository.

## Architecture

- `src/domain/` contains pure deterministic engines and unit-testable rules.
- `src/state/` owns persisted state, queueing, secure sessions, and sync actions.
- `src/data/` is the only network boundary and catalog mapping layer.
- `src/screens/` follows the approved design sequence.
- `src/components/` contains shared Nourish primitives and navigation.

Nutrition snapshots are copied into each saved meal item. Later catalog changes
never rewrite history.

On native devices, onboarding profile data, meal history, water, weight, and the
offline queue are encrypted as one AES-256-GCM payload. The random data key is
generated with Expo Crypto and stored in `expo-secure-store`; it is removed when
the user deletes local data. The web preview uses local browser storage without
the native secure-store key and is intended for development/QA, not as the
production health-data surface.
