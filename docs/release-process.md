# Release process (S5)

How a Nourish build becomes a downloadable release, and what is guaranteed at
each step. Behaviour contracts: `docs/behaviors/release-download-update.md`
(REL-01…REL-04). Master prompt: §37–§52, §64–§68.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Release metadata | `releases/latest.json` | The canonical document the website and the app read. Never contains a version that has not been built. |
| Metadata generator | `scripts/generate-latest-json.mjs` + `scripts/release-metadata.mjs` | Builds and validates that document from the actual artifacts (checksums, sizes, iOS signing state). |
| Release pipeline | `.github/workflows/build-release.yml` | Tests → Android (APK/AAB) → iOS artifact → GitHub Release → R2 upload → metadata update. |
| Mobile CI | `.github/workflows/android-ci.yml` | Analyse, test and debug-build on every mobile change. |
| Website CI | `.github/workflows/website.yml` | Validates the site and publishes it to Cloudflare Pages. |

## Cutting a release

```bash
git tag v1.0.0
git push origin v1.0.0
```

The pipeline then:

1. **Gates.** `flutter analyze` and `flutter test` for `packages/domain`,
   `packages/design-system` and `apps/mobile`, plus the release-tooling tests
   (`node --test "scripts/*.test.mjs"`,
   `node --test "apps/website/test/*.test.mjs"`) and
   `generate-latest-json.mjs --check`. **Nothing is published if any of these
   fail** (master §46).
2. **Android.** Restores the keystore from secrets when they exist, otherwise
   builds unsigned and labels it; produces a universal APK, per-ABI APKs and an
   AAB, and writes `SHA256SUMS.txt`.
3. **iOS.** Builds `--no-codesign` and names the artifact
   `…-UNSIGNED-DEVELOPMENT.ipa`, with a `READ-ME-FIRST.txt` stating that it is
   not installable. The signed path (certificate import, provisioning profile,
   App Store Connect key, TestFlight) is documented in place and must be added
   inside the iOS job only, so signing logic stays isolated from Android.
4. **GitHub Release.** Publishes the binaries and `SHA256SUMS.txt` as the
   canonical archive.
5. **R2.** Uploads `android/…` and `ios/…`, generates `latest.json` from the
   artifacts that actually exist, publishes it to `metadata/latest.json`, and
   commits the same document back to `releases/latest.json`. The website serves
   that committed copy from its own origin, so a release never needs a website
   rebuild.

## Required secrets (master §41, §47)

| Secret | Used for |
|---|---|
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | signing the Android release |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | uploads and download URLs |
| `IOS_CERTIFICATE_BASE64`, `IOS_CERTIFICATE_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `IOS_KEYCHAIN_PASSWORD`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY_BASE64` | the signed iOS path (not yet implemented) |

Without the Android keystore secrets the pipeline still builds, but the artifact
is unsigned and is labelled as such. Without the Cloudflare secrets the website
job validates and skips the deploy with a warning rather than failing silently.

## Verify a download yourself

```bash
sha256sum Nourish-v1.0.0-arm64.apk
# compare with the SHA-256 shown on the download page (REL-04)
```

## Local checks before pushing a tag

```bash
node --test "scripts/*.test.mjs"
node --test "apps/website/test/*.test.mjs"
node scripts/generate-latest-json.mjs --check
npx --yes html-validate@9 "apps/website/*.html"
```

You can also generate a metadata document from local artifacts without any
cloud credentials:

```bash
mkdir -p /tmp/android && cp Nourish-v1.0.0-arm64.apk /tmp/android/
node scripts/generate-latest-json.mjs \
  --version 1.0.0 --tag v1.0.0 --date 2026-09-19 \
  --base-url https://downloads.nourish.app \
  --repository nourish-app/nourish \
  --android-dir /tmp/android \
  --out releases/latest.json
```

## Hard rules

- An unsigned iOS artifact is **never** presented as an installable iPhone app,
  anywhere (master §65, REL-02). `--ios-signed` is a claim; the presence of a
  signed `Nourish-<tag>.ipa` is what makes `installable` true.
- A binary is never linked without a published SHA-256 (REL-04).
- The app never installs an APK and never self-updates: DOWNLOAD UPDATE opens
  the URL in the device browser (REL-03).
- The website never hardcodes a version or a download URL.
