# nourish_mobile

The Nourish Flutter app: offline-first meal logging, targets, insights, weight
and water tracking, on top of the Ethiopian FCT 2025 catalog.

Read the repository [`README.md`](../../README.md) for the full picture and
`docs/swarm/STATE.md` for what is built and verified right now.

## Run

```powershell
flutter pub get
flutter run                     # Android or Windows; no API is required
```

The app is usable with no account and no network: logging, targets, insights and
the recommendation engine all read local Drift tables. Two lanes reach the
network — the catalog sync and meal analysis — and both have offline fallbacks
(the bundled seed catalog, and an honest "recognition is unavailable" path).

## Structure

| Path | What lives there |
| --- | --- |
| `lib/core` | Pure helpers: clock seam, date keys, formatters, water-goal bounds, launcher seam. |
| `lib/data/tables`, `lib/data/daos`, `lib/data/repositories` | Drift schema and every write path. Repositories are the only writers. |
| `lib/data/sources` | **The only network egress.** `api_catalog_data_source.dart`, `analysis_api_client.dart`, `auth_api_client.dart`, `sync_api_client.dart`, `release_metadata_source.dart`. Nothing else in the app opens a socket. |
| `lib/data/services` | Platform seams with fake implementations for tests (`image_acquisition_service`, `token_store`). |
| `lib/features/*` | One folder per behaviour group, each with its own providers; screens never touch Drift directly. `features/sync` holds the offline-queue push engine. |
| `lib/l10n/strings.dart` | Every user-facing string (the i18n seam). Screens do not hardcode copy. |
| `test/` | Unit and widget tests. `test/pump_app.dart` is the full-app harness; `test/test_helpers.dart` holds the offline fakes (release metadata, image picker, HTTP, token store) so no test ever opens a socket or a keychain. |
| `tool/auth_live_check.dart`, `tool/sync_live_check.dart` | Manual live checks against a running API (sign-in; queue push and read-back). Not part of the test suite — the suite must stay offline. |

## Verify

```powershell
flutter analyze
flutter test
```

Live sign-in and backup checks (need the API running with `SMS_PROVIDER=console`):

```powershell
dart run tool/auth_live_check.dart request +251911000123
# read the code from the API log, then:
dart run tool/auth_live_check.dart session +251911000123 123456
dart run tool/sync_live_check.dart +251911000123 123456
```

`sync_live_check` signs in, pushes a meal, a water log, a weight entry and one
deliberately incomplete meal, then reads the changes back: it asserts the three
good operations were applied, the incomplete one was refused per-operation, and
the rows the server stored match what was sent. It is what caught the two wire
mismatches the fakes had hidden (a required `clientId` on every meal item, and
refusals arriving in a separate `rejected` array with a `reason`).
