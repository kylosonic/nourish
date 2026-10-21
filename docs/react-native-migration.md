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
