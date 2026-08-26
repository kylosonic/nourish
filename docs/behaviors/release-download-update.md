# Release, Download & Update Behaviors (REL)

Sources: `Nourish — GitHub Actions Mobile Release Workflow.md`, Master §33–§52,
§64–§68.

---

## REL-01: Release metadata (latest.json)

- **Actor:** system (release pipeline)
- **Trigger:** each tagged release build
- **Preconditions:** artifacts built and verified
- **Action:** pipeline publishes a machine-readable release metadata file
- **Visible state:** n/a (consumed by website and app)
- **Expected outcome:** a single canonical metadata file exposes: version,
  release date, Android availability with APK/AAB URLs, iOS availability
  with `installable` flag, and the GitHub release URL. Consumers never
  hardcode versions.
- **Failure outcome:** a release whose tests, analysis, or builds fail is
  never published; a signed release missing required secrets is never
  published (pipeline rule, Master §46)
- **Acceptance examples:**
  - Given release v1.0.0, When the pipeline completes, Then latest.json
    reports version "1.0.0" with android.available = true and
    ios.available = false (while unsigned)

---

## REL-02: Website download UX

- **Actor:** website visitor
- **Trigger:** Download section / download CTA
- **Preconditions:** latest.json reachable
- **Action:** device-dependent
- **Visible state:** the download area renders per device:
  - **Android:** DOWNLOAD APK (direct link from metadata)
  - **iPhone/iPad with signed Apple distribution:** DOWNLOAD FOR IPHONE
  - **iPhone/iPad without signed distribution:** "IPHONE VERSION COMING
    SOON" plus the explanation that iOS distribution requires Apple signing
    and distribution approval
  - **Desktop:** GET NOURISH ON ANDROID + VIEW RELEASES
- **Expected outcome:** the website reads release metadata dynamically —
  publishing a new APK never requires editing or rebuilding the website.
  Each binary is shown with version, release date, file size, and SHA256 so
  users can verify downloads.
- **Failure outcome:** if metadata is unreachable, the download section
  degrades to the GitHub Releases link; it never shows stale hardcoded links
- **Edge cases:** **hard rule** — an unsigned IPA is never presented as an
  installable iPhone app anywhere in the product (Master §65). iOS CTA text
  changes only when a real Apple distribution channel exists.
- **Acceptance examples:**
  - Given an iPhone visitor and no signed iOS build, When the download
    section renders, Then it says "IPHONE VERSION COMING SOON" and shows no
    install link
  - Given an Android visitor, When the section renders, Then the APK link,
    its size, and its SHA256 come from latest.json

---

## REL-03: In-app update check

- **Actor:** signed-in user (app, background check)
- **Trigger:** periodic app-initiated request to the release metadata endpoint
- **Preconditions:** connectivity; Android device
- **Action:** compare installed vs. latest version
- **Visible state:** when a newer Android release exists, a "New version
  available." notice with **DOWNLOAD UPDATE**
- **Expected outcome:** tapping DOWNLOAD UPDATE opens the download URL in the
  device browser. The app never silently installs APKs and never auto-updates
  itself.
- **Failure outcome:** unreachable metadata → no notice; the user is not
  bothered
- **Edge cases:** version comparison is semantic; a downgraded metadata must
  not prompt
- **Acceptance examples:**
  - Given installed 1.0.0 and latest 1.1.0, When the check runs, Then the
    update notice appears with the DOWNLOAD UPDATE action opening the URL

---

## REL-04: Download security

- **Actor:** system (pipeline) and user (verification)
- **Trigger:** each published binary
- **Preconditions:** build complete
- **Action:** publish checksums
- **Visible state:** SHA256 displayed next to each download
- **Expected outcome:** every published binary (APK, AAB, IPA) has a
  published SHA256 checksum in the release and on the website. Download
  hosting is over HTTPS from the canonical downloads domain.
- **Failure outcome:** a binary without a published checksum is not linked
  from the website
- **Acceptance examples:**
  - Given release v1.0.0, When the release publishes, Then SHA256SUMS exists
    and matches every asset
