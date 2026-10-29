# React Native release process

The active client is `apps/mobile-rn`. The unsigned preview pipeline builds an
installable Android APK and an unsigned iOS archive; the latter cannot be
installed on a standard iPhone. Store distribution uses the separate EAS release
workflow and requires the appropriate platform signing credentials.

## Release workflow

`.github/workflows/react-native-artifacts.yml` verifies the client with lint,
typecheck, and unit tests, then builds and publishes the Android and iOS
preview artifacts. Before publishing a release:

1. Update `expo.version` in `apps/mobile-rn/app.json`, the package version and
   lockfile, and both native build numbers.
2. Push the reviewed changes to the default branch.
3. Run **React Native Unsigned Artifacts** with matching values for
   `release_tag` (for example `v1.3.4`), `version` (`1.3.4`), and `prerelease`
   (`true`).
4. The workflow publishes APK/IPA assets and `SHA256SUMS.txt`, then generates
   `releases/latest.json` and `apps/website/latest.json` from the built APK and
   commits that metadata. Vercel serves the updated website from the connected
   repository.

The APK is debug-signed for direct development testing, not Play Store
distribution. The iOS artifact is unsigned and explicitly marked as
non-installable. A binary is never linked without its SHA-256 checksum.

## Store builds

`.github/workflows/react-native-release.yml` runs EAS builds and requires an
`EXPO_TOKEN` plus configured EAS signing credentials. Use the `production`
profile only when the target store release has been reviewed and is signed for
distribution. Never present an unsigned iOS archive as installable.

## Verify a download

Compare the artifact’s SHA-256 with `SHA256SUMS.txt` and the checksum listed on
the download page. `scripts/generate-latest-json.mjs --check` validates the
committed metadata against the release metadata contract.
