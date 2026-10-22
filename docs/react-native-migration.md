# React Native Rebuild — Implementation Record

Date: 2026-10-21

## Scope

The active first-release mobile experience was rebuilt in the new
`apps/mobile-rn` Expo/React Native client. The existing Flutter implementation
was retained as a reference and was not deleted. The NestJS API, product
behavior contracts, Ethiopian FCT data authority, and release metadata remain
the shared backend/product authority.

## Preserved product invariants

- The AI proposes foods and rough portions; local/database code calculates
  nutrition.
- Saved meal items carry frozen nutrition snapshots.
- Unresolved or unknown computed foods are never silently saved.
- Missing AI, SMS, voice, barcode, OCR, and notification providers fail or
  explain honestly; they do not return canned production results.
- Image bytes are not persisted by the analysis request. The React Native meal
  record no longer retains the source photo URI.
- Offline logging remains available from the cached catalog and persisted state.
- Sessions use expo-secure-store on native platforms. The web preview does not
  persist refresh credentials because expo-secure-store is unavailable there.
- Native health-data persistence uses an AES-256-GCM encrypted blob. Its random
  key is held in expo-secure-store and removed with local app data.

## Design mapping

| Design | React Native route |
| --- | --- |
| `welcome_screen` | `Welcome` |
| `language_selection` | `Language` |
| `goal_selection` | `Goal` |
| `body_information` | `Body` |
| `activity_level` | `Activity` |
| `preferred_pace` | `Pace` |
| `food_preference` | `FoodPreference` |
| `daily_target_summary` | `DailyTarget` |
| `home_screen` | `MainTabs > Home` |
| `scan_menu` | `ScanMenu` |
| `camera_screen` | `Camera` |
| `ai_analysis_screen` | `Analysis` |
| `ai_result_screen` | `Result` |
| `low_confidence_state` | `LowConfidence` |
| `food_search` | `FoodSearch` |
| `meal_history_log` | `History` |
| `insights_dashboard` | `MainTabs > Insights` |

The edit-before-save, text log, settings, account, and privacy screens have no
approved Stitch source. They use the same Nourish tokens and the existing
behavior contracts, as the prior Flutter implementation did.

## Verification evidence

Run from `apps/mobile-rn`:

- `npm test` — deterministic engine and insight suite.
- `npm run typecheck` — strict TypeScript.
- `npx expo lint` — Expo configuration and React/TypeScript rules.
- `npx expo export --platform web` — production Metro bundle.
- Visual traversal at a 390×844 viewport through onboarding, target, home,
  scan menu, search, add, history, insights, progress, profile, and settings.
- Responsive checks at 375, 768, and 1280 pixels; the web preview caps the
  app surface at 480 pixels and centers it on wider displays.

The local NestJS process and Docker daemon were unavailable during the RN visual
run, so the live-provider loop was not exercised from the RN UI in this session.
The API remains independently covered by its existing test suite, and the
client maps the documented wire contract.

The dependency audit is not clean: Expo 58 currently resolves high-severity
advisories in `braces` and `node-forge` through Metro and Expo CLI. Both named
upstream packages are already at their latest published versions; npm's only
automatic remedy is an invalid downgrade to Expo 44. This remains a tracked
build-toolchain risk, not a claimed clean audit.

## Remaining launch dependencies

Production launch still requires external configuration: AI provider key,
SMS gateway, verified packaged-product source if barcode/OCR is enabled, EAS
project linkage/signing credentials, Apple distribution approval, and the
server-side account-erasure endpoint required by the privacy contract.

## Published build

GitHub prerelease `v1.1.0` was produced by workflow run `39658274332` from
source commit `9fc8cca`. It contains:

- `Nourish-1.1.0.apk` — 110,266,199 bytes, Android APK Signature Scheme v2
  verified, signed with the generated development debug key.
- `Nourish-1.1.0-UNSIGNED.ipa` — 13,619,747 bytes, bundle
  `app.nourish.mobile`, version `1.1.0`/build `1`, no code signature or
  provisioning profile.
- `SHA256SUMS.txt` — downloaded-byte verification passed for both artifacts.

## Published `v1.2.0` build

GitHub prerelease `v1.2.0` was produced by workflow run `39769071548` from
source commit `43ebf18`. This build adds email/password and Google account entry
points, reserves phone OTP as a third lane, replaces the bottom bar with the
supplied floating glass navigation treatment, reduces explanatory copy, and
makes manual food selection the primary scanner recovery path.

The visual navigation adaptation uses the supplied nav's 76px glass capsule,
animated selection lens, specular and inner-shadow edges, pointer-follow radial
glow, and an adapted five-destination layout so Scan remains one tap away.

Downloaded release bytes were independently verified:

- `Nourish-1.2.0.apk` — 110,405,655 bytes; SHA-256
  `e44e3601153b736b9a4316c69b480178a419e3d5ef8a1b8cb65596ef0c6399d0`;
  Android APK Signature Scheme v2 verified with one generated development/debug
  signer; `app.nourish.mobile`, versionCode `2`, versionName `1.2.0`.
- `Nourish-1.2.0-UNSIGNED.ipa` — 13,709,971 bytes; SHA-256
  `cfd73af383c2668007e7de88fdc6ab99be18a71d8c6cb712a0b35f4531b7b110`;
  `Payload/Nourish.app`, bundle `app.nourish.mobile`, version `1.2.0`, no
  `_CodeSignature`, and no provisioning profile.
- `SHA256SUMS.txt` — both downloaded files match the published checksums.

The release remains a preview. Cloud recognition and live Google/email account
creation still require a reachable API URL, Google OAuth client IDs, and an AI
provider configuration; no such credentials are present in this repository.

## Published `v1.3.0` build

GitHub prerelease `v1.3.0` was produced by workflow run `39783149395` from
source commit `88a1af4`. This build:

- changes the navigation animation to a timed 360 ms slide and verifies the
  active lens positions through the browser render path;
- removes Describe Meal and Voice from the scanner menu and all navigation
  fallbacks;
- opens a grams editor for every food-search result, supports 1–2,000 g and
  preset amounts, and recalculates nutrition before saving;
- enables persisted hydration notifications at 10:00, 14:00, and 18:00, asks
  for native permission on first enable, and sends an immediate confirmation
  notification.

The Android release manifest check confirms `POST_NOTIFICATIONS`, the
`expo.modules.notifications` receivers, the notification handler, and the
default notification icon/color. Local scheduled notifications do not require a
remote push provider; remote multi-device push would still require Expo/FCM/APNs
delivery credentials.

Downloaded release bytes were independently verified:

- `Nourish-1.3.0.apk` — 110,824,283 bytes; SHA-256
  `dd98dd28a6ffcc4e6a3d1d7024e895c82044b1a4050bc473a57e8b106779ffcb`;
  APK Signature Scheme v2 verified with the development/debug signer;
  `app.nourish.mobile`, versionCode `3`, versionName `1.3.0`.
- `Nourish-1.3.0-UNSIGNED.ipa` — 13,864,647 bytes; SHA-256
  `2a05a3c998233e52a563dcc614ec6a9f60d0c4b77364c7fc9edcda91f6cec118`;
  `Payload/Nourish.app`, bundle `app.nourish.mobile`, version/build `1.3.0/3`,
  no `_CodeSignature`, and no provisioning profile.
- `SHA256SUMS.txt` — both downloaded files match the published checksums.

The emulator was stopped at the user's request before an attended system-banner
interaction could be recorded. Notification packaging and permission generation
are verified by the APK manifest gate; physical device delivery remains a UAT
step for the next installed-device check.
