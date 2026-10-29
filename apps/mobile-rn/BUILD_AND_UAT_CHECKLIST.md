# Nourish — Build & UAT Checklist

> This checklist covers generating production builds using **completely free tooling** (no paid CI minutes, no Apple Developer Program for local testing, no Google Play Console for sideloading).

---

## Part A: Environment Prerequisites

### 1. API Endpoint

Set your deployed API URL **before building** so the app embeds the correct host:

```bash
# Option 1: Environment variable (used by app.config.ts)
export NOURISH_API_URL=https://your-api-host.onrender.com

# Option 2: In apps/mobile-rn/.env
EXPO_PUBLIC_API_URL=https://your-api-host.onrender.com
```

Verify: `echo $NOURISH_API_URL` should print your live API URL.

### 2. Node & Tooling

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| Expo CLI | ≥ 16 | `npm install -g eas-cli` |
| pnpm (for API) | ≥ 9 | `npm install -g pnpm` |
| Android Studio | Latest | For Android builds |
| Xcode | ≥ 15 | For iOS builds (macOS only) |

### 3. AI & Auth Keys (Free Tier)

| Service | Where to Get It | Free Limit |
|---------|----------------|------------|
| **Gemini API Key** | [Google AI Studio](https://aistudio.google.com) | 1,500 req/day |
| **Resend API Key** | [resend.com](https://resend.com) | 100 emails/day |
| **Firebase Project** | [Firebase Console](https://console.firebase.google.com) | 10K MAU/month |
| **Google OAuth** | [Google Cloud Console](https://console.cloud.google.com) | Free |

---

## Part B: Android Production Build (AAB) — Free Path

### Step 1: Prebuild (eject to native Android project)

```bash
cd apps/mobile-rn
npx expo prebuild --platform android --clean
```

This generates `android/` directory with a Gradle project.

### Step 2: Generate or Reuse Signing Keystore

**First time only** — create a release keystore (free, no Play Console needed):

```bash
cd android/app
keytool -genkey -v \
  -keystore nourish-release.keystore \
  -alias nourish-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Nourish Team, O=Nourish, C=ET"
```

Backup `android/app/nourish-release.keystore` securely — **lose it = cannot update the app**.

### Step 3: Configure Gradle Signing

Create or edit `android/gradle.properties`:

```properties
NOURISH_STORE_FILE=nourish-release.keystore
NOURISH_KEY_ALIAS=nourish-key
NOURISH_STORE_PASSWORD=YOUR_STORE_PASSWORD
NOURISH_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Edit `android/app/build.gradle` — verify the `signingConfigs.release` block:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(NOURISH_STORE_FILE)
            storePassword NOURISH_STORE_PASSWORD
            keyAlias NOURISH_KEY_ALIAS
            keyPassword NOURISH_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build the AAB

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Convert AAB → APK for Sideloading (Free)

Install [bundletool](https://github.com/google/bundletool/releases) (free, open source):

```bash
# Download latest bundletool.jar from GitHub releases
java -jar bundletool.jar build-apks \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=app-release.apks \
  --mode=universal \
  --ks=app/nourish-release.keystore \
  --ks-pass=pass:YOUR_STORE_PASSWORD \
  --ks-key-alias=nourish-key \
  --key-pass=pass:YOUR_KEY_PASSWORD

# Extract the universal APK
unzip -p app-release.apks universal.apk > nourish-v$(cat ../../package.json | grep version | head -1 | sed 's/.*"\(.*\)".*/\1/').apk
```

Distribute the `.apk` file directly — no Google Play Console needed.

### Step 6: Install on Device for UAT

```bash
adb install -r nourish-v1.4.0.apk
```

---

## Part C: EAS Cloud Build (Alternative)

If you prefer cloud builds (free tier includes 30 Android + 30 iOS builds/month):

```bash
cd apps/mobile-rn

# Configure EAS project (one-time)
eas build:configure

# Android AAB (for Play Store later)
eas build --platform android --profile production

# Android APK (for direct distribution)
eas build --platform android --profile preview

# iOS (requires Apple Developer account, $99/yr)
eas build --platform ios --profile production
```

---

## Part D: Human Device UAT Test Script

> Run every build through this script on a **real Android device** before calling it production-ready.

### Environment: Fresh Install Test

1. **Uninstall** any previous Nourish app from the test device.
2. **Install** the new APK/AAB.
3. **Launch** — verify splash screen appears with Nourish branding.
4. **Accept permissions** — camera, notifications (if prompted).

### Onboarding Flow

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Complete language selection (English / Amharic) | Language persists |
| 2 | Fill onboarding: goal, sex, age, height, weight, activity, pace | Daily target calculated and shown |
| 3 | Tap "START TRACKING" | Arrives at Home screen with target ring |

### Core Logging (Offline First)

| # | Action | Expected Result |
|---|--------|-----------------|
| 4 | Search for "shiro" in food search | Ethiopian food results appear |
| 5 | Tap a food, adjust portion, save meal | Meal appears in today's log |
| 6 | Add water (e.g., 250 ml) | Water total updates |
| 7 | Add weight entry | Weight appears in history |
| 8 | **Enable airplane mode** | App continues working (offline) |
| 9 | Log another meal while offline | Meal saved locally |
| 10 | **Disable airplane mode** | Auto-sync triggers, changes push to server |

### Camera & AI Analysis

| # | Action | Expected Result |
|---|--------|-----------------|
| 11 | Tap camera icon, photograph a real meal | AI returns ingredient list with confidence |
| 12 | Tap "ADJUST" on result screen | Edit screen opens with all items editable |
| 13 | Remove one item, add another food, save | Only selected items saved; corrections sent |
| 14 | Check meal in history | Saved meal shows correct nutrition totals |

### Barcode Scanning

| # | Action | Expected Result |
|---|--------|-----------------|
| 15 | Scan a packaged food barcode (e.g., biscuit packet) | Nutrition info loads from Open Food Facts |
| 16 | If barcode not found, tap "SCAN NUTRITION LABEL" (Pro) | OCR reads label via Gemini Flash |

### Account & Sync

| # | Action | Expected Result |
|---|--------|-----------------|
| 17 | Sign up with email + password | Account created, session starts |
| 18 | Log a meal → check server data | Meal appears on another device with same account |
| 19 | Sign out → sign in again | All historical data restored from server |
| 20 | Uninstall app → reinstall → sign in | Pull restore brings back all meals, water, weight |

### Consent & Privacy

| # | Action | Expected Result |
|---|--------|-----------------|
| 21 | Toggle "Help improve food recognition" | Server consent record updates |
| 22 | Toggle "Product analytics" | Server consent record updates |
| 23 | Go to Privacy Center → tap "DELETE ACCOUNT" | Confirmation modal requires typing "DELETE" |
| 24 | Type DELETE → confirm deletion | All data wiped locally and on server |
| 25 | Try signing in with deleted credentials | "Account not found" or sign-in-as-new |

### Hydration Reminders

| # | Action | Expected Result |
|---|--------|-----------------|
| 26 | Enable hydration reminders in Settings | Notifications scheduled |
| 27 | Log water until goal is reached | Remaining notifications cancelled for today |
| 28 | Next day | Reminders resume at configured start time |

### Premium / Paywall (Mock Mode)

| # | Action | Expected Result |
|---|--------|-----------------|
| 29 | Tap "Nourish Plus" in Settings | Paywall opens with Monthly/Annual |
| 30 | Tap "START NOURISH PLUS" (mock mode) | Plus unlocked, label scanning works |
| 31 | Tap "RESTORE PURCHASES" | Restores entitlement state |

### Edge Cases & Crashes

| # | Action | Expected Result |
|---|--------|-----------------|
| 32 | Rapidly tap multiple UI buttons | No crashes, only last action wins |
| 33 | Kill app mid-sync | On relaunch, unsynced operations remain in queue |
| 34 | Server returns 503 (AI unavailable) | Honest error message, no fake results |
| 35 | Submit invalid OTP code | Clear error, attempts decremented |

---

## Part E: Go-Live Checklist

Before publishing or distributing widely:

- [ ] Build passes `npx expo-doctor` with zero critical warnings
- [ ] `npm audit` shows zero high/critical vulnerabilities (or documented workarounds)
- [ ] APK/AAB size under 50 MB
- [ ] All UAT test cases above pass on at least 2 devices
- [ ] API health endpoint (`/health`) returns 200
- [ ] Database migrations applied on production Postgres
- [ ] Food catalog seeded (`npx prisma db seed`)
- [ ] GEMINI_API_KEY set and daily budget configured
- [ ] Sentry DSN set (optional but recommended for crash tracking)
- [ ] Privacy Policy, Terms, and Support pages live on Vercel
- [ ] App version bumped in `package.json` and `app.json`
- [ ] APK hosted on GitHub Releases with checksums
- [ ] Landing page download button points to correct release URL

---

## Part F: Emergency Rollback

If a release is broken:

```bash
# Roll back API (Render)
# Dashboard → Manual Deploy → select previous commit

# Roll back mobile: distribute previous APK via GitHub Releases
# Users reinstall from the older release page
```

---

## Part G: Free Service Limits Summary

| Service | Free Tier | When You'll Hit It |
|---------|-----------|-------------------|
| Render Web | 512 MB, sleeps after 15 min | ~100 concurrent users |
| Render Postgres | 1 GB, 90 days | Data > 1 GB or 90 days elapsed |
| Neon Postgres | 500 MB, forever | Data > 500 MB |
| Gemini Flash | 1,500 req/day | ~50 photo analyses/day |
| Resend Email | 100 emails/day | 100 sign-ups/day |
| Firebase Auth | 10K MAU | 10,000 active users/month |
| Sentry | 5K errors/month | If you exceed this, debugging is your top priority |
| EAS Builds | 30/mo per platform | Beyond 30 builds, use local prebuild |
| Vercel (landing) | 100 GB bandwidth/mo | Massive traffic or large assets |

---

*Checklist version: 2026-10-29. Update when adding new features or changing build targets.*
