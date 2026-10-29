# React Native mobile release

The active release workflow is
`.github/workflows/react-native-artifacts.yml`. It runs lint, typecheck, and
unit-test gates, builds an Android APK and an unsigned iOS archive, publishes
checksums and a GitHub prerelease, then updates the website download metadata.

Set the Expo version and native build numbers in `apps/mobile-rn/app.json` and
keep `package.json` and `package-lock.json` aligned. Push the changes to the
default branch, then dispatch the workflow with a new `release_tag`, the
matching `version`, and `prerelease: true` for development-signed preview
builds.

The Android APK is suitable for direct testing, not Play Store distribution.
The unsigned iOS archive is not installable on a standard iPhone. Store builds
use `.github/workflows/react-native-release.yml` and require EAS credentials.
