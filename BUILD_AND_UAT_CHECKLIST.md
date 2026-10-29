# Nourish 1.4.0 — Build and Human Device UAT

This checklist is the release gate. Automated tests cannot replace installing
the binary and exercising permissions, background delivery, store billing, and
physical-camera behavior.

## 1. Prerequisites

- Node 24 and npm 11
- Java 17 and Android SDK
- macOS with Xcode 16+ for iOS builds
- Docker Desktop for API integration tests
- Free-tier accounts/keys: Render (or Koyeb), Google AI Studio, Firebase,
  Resend or SMTP, RevenueCat, Google Cloud OAuth

Copy environment templates and never commit real credentials:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile-rn/.env.example apps/mobile-rn/.env
```

Production API variables:

```text
NODE_ENV=production
DATABASE_URL=<PostgreSQL URL>
JWT_SECRET=<generated 48-byte secret>
CORS_ORIGINS=https://nourish-kylosonic.vercel.app
AI_PROVIDER=gemini
GEMINI_API_KEY=<Google AI Studio key>
GEMINI_MODEL=gemini-2.5-flash
EMAIL_OTP_PROVIDER=resend
RESEND_API_KEY=<Resend key>
OTP_EMAIL_FROM=Nourish <no-reply@verified-domain>
FIREBASE_PROJECT_ID=<Firebase project id>
GOOGLE_CLIENT_ID_IOS=<client id>
GOOGLE_CLIENT_ID_ANDROID=<client id>
GOOGLE_CLIENT_ID_WEB=<client id>
```

Mobile variables:

```text
EXPO_PUBLIC_API_URL=https://<render-service>.onrender.com
NOURISH_API_URL=https://<render-service>.onrender.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<client id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<client id>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<client id>
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<public SDK key>
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=<public SDK key>
```

For store-review testing without billing approval, set
`EXPO_PUBLIC_REVENUECAT_MOCK=true`. The paywall is visibly labelled as mock
billing in that mode.

## 2. Backend verification

```powershell
cd apps/api
docker compose up -d
npx prisma migrate deploy
npm run import:fct:fixture
npm run lint
npm run build
npx prisma validate
npm test
npm run test:e2e
```

Expected: lint/build/validate clean, all unit tests pass, and the E2E suite
passes against PostgreSQL. Verify `/v1/healthz` returns HTTP 200.

## 3. Mobile verification

```powershell
cd apps/mobile-rn
npm ci
npx expo install --fix
npx expo-doctor
npm run lint
npm run typecheck
npm test
npx expo export --platform web
```

Run `npm audit --omit=dev` and `npm audit` and record any remaining transitive
advisories. Do not use `npm audit fix --force` if it proposes an Expo downgrade.

## 4. Local Android release bundle

Generate the native project:

```powershell
cd apps/mobile-rn
npx expo prebuild --platform android --clean
```

Generate an upload keystore outside source control:

```powershell
keytool -genkeypair -v `
  -storetype JKS `
  -keystore C:\secure\nourish-upload.keystore `
  -alias nourish `
  -keyalg RSA -keysize 2048 -validity 10000
```

Use EAS with the credentials you own:

```powershell
npx eas-cli@latest login
npx eas-cli@latest credentials --platform android
npx eas-cli@latest build --platform android --profile production
```

The production profile emits an `.aab`. For a directly installable APK:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Keep the keystore, alias, and passwords in a password manager. Losing the
upload key can block future Play updates.

## 5. Local iOS archive on macOS

```bash
cd apps/mobile-rn
npx expo prebuild --platform ios --clean
cd ios
pod install
open Nourish.xcworkspace
```

In Xcode:

1. Select the `Nourish` scheme and `Any iOS Device (arm64)`.
2. Set the Apple team and confirm bundle ID `app.nourish.mobile`.
3. Product → Archive.
4. Organizer → Distribute App → App Store Connect.

For a free development-signed device build:

```bash
npx expo run:ios --device
```

An unsigned IPA is an inspection artifact and must never be presented as
installable.

## 6. Human device UAT

Record pass/fail and screenshot/video evidence for every item.

### Onboarding and offline core

- [ ] Fresh install opens Welcome without requesting camera, photos, or notifications.
- [ ] Complete all onboarding steps and verify the deterministic daily target.
- [ ] Kill and relaunch mid-onboarding; it resumes at the first unanswered section.
- [ ] Airplane mode: search the cached catalog, add a meal, water, and weight.
- [ ] Relaunch offline; all local records remain and totals are unchanged.

### Authentication and consent

- [ ] Phone OTP works with Firebase phone auth or the configured SMS/email fallback.
- [ ] Email OTP works with Resend or SMTP and does not reveal the code in the response.
- [ ] Email/password and Google sign-in succeed with configured credentials.
- [ ] Toggle AI-improvement and analytics consent online; relaunch and confirm the server values persist.
- [ ] Toggle while offline; reconnect and confirm `PATCH /v1/account/consent` flushes once.

### Backup, restore, background sync

- [ ] Sign in on a second clean installation; account meals, water, and weights restore automatically.
- [ ] Restore again; no duplicate IDs appear.
- [ ] Edit a same-ID meal on device A; sync; device B receives the newer version.
- [ ] Delete on device A; sync; device B removes the row via tombstone.
- [ ] Make an offline change, reconnect, and confirm it syncs without pressing a button.
- [ ] Background the app for at least 20 minutes; return to foreground and confirm delta sync.
- [ ] Put the app in the OS background-test state and verify the registered fetch task remains configured.

### Saved meal editing and AI corrections

- [ ] Open History → meal → Edit meal.
- [ ] Change a portion, food, and item count; save.
- [ ] Confirm the same meal ID updates locally and server-side with no duplicate.
- [ ] Correct an AI result before save; server `AnalysisCorrection.details` contains original estimate, user correction, and food context.

### Barcode, label OCR, and premium gate

- [ ] Scan a packaged product known to Open Food Facts with complete per-100g values; confirm name, brand, serving, and macros.
- [ ] Scan the same barcode again offline after prior cache; confirm it resolves without upstream access.
- [ ] Scan an unknown barcode; the app offers nutrition-label OCR rather than only manual search.
- [ ] As a free user, label OCR opens the paywall.
- [ ] In UAT mock mode, activate Plus, scan a clear label, and verify serving/kcal/protein/carb/fat prefill.
- [ ] Scan an unreadable label; no values are guessed.
- [ ] With RevenueCat production keys, purchase monthly and restore purchases on a second build.

### State-aware hydration reminders

- [ ] Configure start, end, and interval in Settings.
- [ ] Enable notifications and confirm the permission prompt appears only after opt-in.
- [ ] Add water below the goal; today's remaining reminders stay scheduled.
- [ ] Reach the water goal; remaining reminders for today are cancelled and tomorrow starts at the configured time.
- [ ] Disable reminders; all app-owned reminder notifications are cancelled.

### Account deletion and support

- [ ] Settings → Delete account; typing anything other than `DELETE` cannot submit.
- [ ] Confirm deletion; app returns to Welcome and local/secure storage is removed.
- [ ] Old access token receives 401 after deletion.
- [ ] Database has no user, sessions, consent, meals, water, weights, entitlement, or account-linked analysis rows.
- [ ] Website `/support` deletion form creates a pending request and returns a reference ID.

### Website and release integrity

- [ ] `/privacy`, `/terms`, `/support`, and `/data-deletion` return HTTP 200 and contain no `[to be supplied]` text.
- [ ] Android download from the live website returns HTTP 200.
- [ ] Downloaded APK size and SHA-256 exactly match `latest.json`.
- [ ] Unsigned iOS artifact is never offered as an installable download.
- [ ] In-app update check compares semantic versions correctly.

## 7. Release decision

Do not merge or submit to an app store until:

- Every automated suite is green.
- Both device platforms have explicit human approval.
- Store billing sandbox tests pass.
- Legal entity/contact details have final owner approval.
- Signing keys are backed up and access-controlled.
- `docs/swarm/STATE.md` records the reviewer, date, evidence, and any deviations.
