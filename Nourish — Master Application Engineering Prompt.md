# NOURISH — MASTER APPLICATION ENGINEERING PROMPT

You are the principal software architect and senior engineering team responsible for building NOURISH.

NOURISH is an AI-powered nutrition and calorie-tracking platform built for Ethiopia, with an architecture designed for international expansion.

The product's signature capability is:

**Take a picture of your meal → identify the foods → estimate portions → calculate nutrition → confirm/edit → save → update daily nutrition targets.**

The product must be original and must not copy proprietary source code, branding, assets, screenshots, or exact visual designs from other applications.

Google Stitch will provide the approved visual design.

The provided Stitch screens and DESIGN.md file are the visual source of truth.

Do NOT redesign the interface unless explicitly instructed.

---

# 1. PRODUCT BRAND

Application:

**NOURISH**

Tagline:

**Nutrition, understood.**

Website:

**https://nourish.app**

Treat `nourish.app` as the canonical production domain.

If the actual domain differs during implementation, centralize it as configuration rather than hardcoding it.

Recommended subdomains:

app.nourish.app
api.nourish.app
downloads.nourish.app
admin.nourish.app

---

# 2. PRODUCT GOAL

Build a premium AI nutrition application that understands Ethiopian food.

The product must support:

Photo meal analysis
Text meal analysis
Voice meal logging
Food search
Barcode scanning
Nutrition-label OCR
Manual logging
Saved meals
Recipes
Water
Weight
Exercise
Progress
AI insights
AI recommendations
Subscriptions
Local payments
Admin food database
AI correction review
Data export
Account deletion

---

# 3. PRIMARY PRODUCT LOOP

Implement:

Home
→ Scan Meal
→ Camera
→ AI Analysis
→ Food Detection
→ Ethiopian Food Retrieval
→ Portion Estimation
→ Nutrition Calculation
→ User Confirmation
→ Meal Saved
→ Dashboard Updated
→ Insights

This must be one of the fastest and most polished flows in the application.

---

# 4. DESIGN HANDOFF

Assume the repository contains:

/design/DESIGN.md

/design/screens/

/design/assets/

/design/prototype/

Read and understand these before implementing UI.

DESIGN.md is the source of truth for:

- typography
- colors
- spacing
- radius
- components
- layout
- navigation
- states
- animation
- accessibility

Do not replace the Stitch design with a generic Flutter template.

---

# 5. TECHNOLOGY

Mobile:

Flutter
Dart
Riverpod
GoRouter
local persistent database
secure storage

Backend:

NestJS
TypeScript
PostgreSQL
Prisma
Redis
BullMQ or equivalent job queue

Storage:

Cloudflare R2

Search:

PostgreSQL initially.

Architecture must permit migration to Typesense/OpenSearch later.

Observability:

Sentry
structured logs
analytics

CI/CD:

GitHub Actions

---

# 6. REPOSITORY

Use a clean monorepo.

Recommended:

/apps/mobile
/apps/api
/apps/admin
/apps/website

/packages/shared
/packages/design-system
/packages/api-client
/packages/domain
/packages/validation

/design
/docs
/.github/workflows

---

# 7. MOBILE APPLICATION

Build the Nourish mobile app in Flutter.

Screens must follow the supplied Stitch designs.

Implement:

Splash
Welcome
Authentication
Onboarding
Daily Target
Home
Scan
Camera
AI Analysis
AI Result
Low Confidence
Edit Meal
Text Logging
Voice Logging
Food Search
Food Details
Meal History
Saved Meals
Recipe Builder
Recipe Details
Water
Weight
Progress
Insights
Insight Detail
What Can I Eat
Weekly Report
Barcode
OCR
Paywall
Subscription
Profile
Settings
Privacy Center

---

# 8. AUTHENTICATION

Primary method:

Ethiopian phone number + OTP

Normalize:

+251

Support:

Google
Apple
Email

as future providers.

Implement:

access token
refresh token
token rotation
secure token storage
session expiration

---

# 9. DATABASE

Implement at minimum:

users
profiles
goals
daily_targets

foods
food_aliases
food_nutrients
food_sources
food_portions
food_preparations

recipes
recipe_ingredients
recipe_servings

brands
products
barcodes

meals
meal_items
meal_images
meal_analysis_runs
ai_candidates

water_logs
weight_logs
exercise_logs
progress_photos

insights
recommendations

subscriptions
subscription_events
payments
payment_events

notifications
device_tokens

consents
audit_logs

model_versions
prompt_versions

feature_flags

admin_users
admin_actions

---

# 10. ETHIOPIAN FOOD DATABASE

Use the Ethiopian Food Composition Table 2025 as a primary authoritative source where applicable.

Do not fabricate authoritative nutritional values when source data exists.

Store provenance:

source_name
source_version
source_food_code
source_reference
import_date

Create a normalized application food layer.

Support:

English
Amharic
future Afaan Oromo
transliterations
common spelling errors
alternative spellings

Example:

doro wot
doro wet
doro we't
ዶሮ ወጥ

→ one canonical food.

---

# 11. FOOD ENTITY

Food must support:

canonical ID
names
aliases
category
recipe relationship
preparation
region
nutrition
portion definitions
source
verification
confidence
status

Do not assume every recipe of the same dish has identical nutritional composition.

---

# 12. PORTION ENGINE

Support:

grams
kilograms
milliliters
servings
pieces
plates
half plates
bowls
cups
glasses
spoons
ladles
small/regular/large
half injera
one injera
large injera

Store conversions in DB.

Do not hardcode nutrition conversions inside prompts.

---

# 13. NUTRITION ENGINE

Implement deterministic calculations.

For basic food:

nutrition_per_100g × grams / 100

For recipe:

sum(ingredient nutrition)
÷ number of servings

Calculate:

calories
protein
fat
carbohydrates
fiber
sodium
other nutrients when data is available

The AI must not be trusted as the final nutrition calculator.

---

# 14. CALORIE TARGET ENGINE

Implement configurable BMR/TDEE calculations.

Store:

formula version
activity factor
goal adjustment
target
date generated

The AI may provide explanations but must not directly decide calorie targets.

---

# 15. AI ARCHITECTURE

Separate:

Vision
Food retrieval
Food normalization
Portion estimation
Nutrition lookup
Confidence
Recommendation

Pipeline:

Image
→ image quality
→ food candidates
→ Ethiopian food retrieval
→ canonical resolution
→ portion estimate
→ nutrition lookup
→ confidence
→ user confirmation
→ persistence

Do not use one giant LLM prompt for all operations.

---

# 16. STRUCTURED AI OUTPUT

All AI services must return validated JSON.

Example:

{
  "foods": [
    {
      "canonical_id": "food_123",
      "display_name": "Doro Wot",
      "portion": {
        "amount": 1,
        "unit": "serving",
        "grams": 220
      },
      "confidence": 0.91
    }
  ],
  "overall_confidence": 0.87
}

Use runtime schema validation.

Reject malformed AI output.

---

# 17. AI CONFIDENCE

Implement confidence states:

High
Medium
Low

Low confidence must trigger confirmation.

Example:

"I’m not completely sure."

Candidate options:

Shiro
Misir Wot
Other stew

---

# 18. TEXT FOOD LOGGING

User:

"2 injera with shiro and an orange."

System:

detects food
normalizes
retrieves nutrition
estimates portions
returns editable entries

User confirms.

---

# 19. VOICE LOGGING

Pipeline:

speech-to-text
→ food extraction
→ food normalization
→ nutrition calculation

User must see transcript before saving.

---

# 20. BARCODE

Pipeline:

barcode
→ product database
→ verified product

If missing:

Offer:

nutrition-label OCR
manual product creation

Never invent packaged product nutrition.

---

# 21. OCR

Extract:

product
serving size
calories
protein
carbohydrates
fat
fiber
sodium
ingredients

Show confirmation before saving.

---

# 22. MEAL DATA

Store:

meal
meal items
source
image
AI analysis run
confidence
user confirmation

Every meal item must preserve the nutrition snapshot used at logging time so that future food-database changes do not silently alter historical meals.

---

# 23. USER CORRECTIONS

Every AI correction should optionally be captured for quality analytics.

Store:

AI prediction
user correction
food
portion
model version
prompt version
timestamp

Build an admin review system.

---

# 24. INSIGHTS

Insights must be derived from actual user data.

Examples:

Protein deficiency relative to target
Weekend calorie patterns
Meal logging consistency
Weight trend
Water consistency

Avoid generic AI motivational content.

---

# 25. RECOMMENDATIONS

Use:

remaining calories
remaining macros
preferences
food database
meal time
user history

Example:

User:

"I have 500 calories left and need 35g protein."

Return Ethiopian/local foods that fit the constraints.

---

# 26. HEALTH SAFETY

The application is a general wellness and nutrition application.

Implement deterministic safety controls for:

minors
pregnancy
eating-disorder disclosures
serious medical conditions
extreme weight targets
extremely low calorie targets

Do not provide diagnosis or treatment.

Provide professional-care guidance when safety thresholds are triggered.

---

# 27. PRIVACY

Treat nutrition, body metrics, food images and fitness data as sensitive.

Implement:

consent tracking
data minimization
encryption
access control
data export
account deletion
audit logs
retention rules

Do not retain original food imagery indefinitely.

Strip unnecessary metadata from uploaded images.

---

# 28. AI IMPROVEMENT CONSENT

Create optional:

"Help improve food recognition"

If enabled:

anonymize
strip metadata
maintain provenance
respect withdrawal

Do not silently use private data to train models.

---

# 29. WATER

Implement:

daily target
manual additions
history
reminders

---

# 30. WEIGHT

Implement:

current
target
history
trend
weekly/monthly views

Avoid emphasizing daily fluctuations.

---

# 31. SUBSCRIPTIONS

Plans:

FREE
PLUS
PRO

Server controls all entitlements.

Never trust the mobile client to decide premium access.

---

# 32. PAYMENT ABSTRACTION

Implement providers behind interfaces.

Initial providers may include:

Telebirr
CBE Birr
M-PESA
Cards
Bank transfer
App Store
Google Play

Use a provider interface:

PaymentProvider

Methods:

createPayment
verifyPayment
handleWebhook
refund
getTransaction

---

# 33. WEBSITE

Create a premium Nourish marketing website at:

https://nourish.app

The website must have:

Hero
Product demonstration
How it works
Ethiopian food AI section
Features
Screenshots
Privacy/trust
Pricing
FAQ
Download section
Contact
Footer

Primary CTA:

GET NOURISH

Secondary:

TRY NOURISH

The website must detect device type and present the appropriate download option.

---

# 34. WEBSITE HERO

Recommended messaging:

NOURISH

Nutrition, understood.

The AI nutrition companion built for the way Ethiopia eats.

Primary:

DOWNLOAD NOURISH

Secondary:

SEE HOW IT WORKS

Use a premium application mockup showing the Nourish meal-scanning experience.

---

# 35. WEBSITE FOOD SECTION

Headline:

Food should be easy to track.

Copy:

"From injera and shiro to tibs and kitfo, Nourish is designed around the foods you actually eat."

Use authentic Ethiopian food imagery and Nourish UI screenshots.

---

# 36. WEBSITE DOWNLOAD SECTION

Create:

DOWNLOAD NOURISH

Android

Download APK

iPhone

COMING SOON

when no signed iOS distribution exists.

Once a valid Apple distribution channel exists, change the CTA to:

DOWNLOAD ON IPHONE

Do not tell iOS users that an unsigned IPA can be directly installed.

---

# 37. WEBSITE DOWNLOAD ARCHITECTURE

The website should not hardcode release versions.

Create a release metadata file:

/releases/latest.json

Example:

{
  "version": "1.0.0",
  "android": {
    "url": "https://downloads.nourish.app/android/Nourish-1.0.0.apk",
    "sha256": "..."
  },
  "ios": {
    "available": false,
    "url": null
  }
}

The website fetches this metadata and dynamically displays download links.

This allows new releases without editing the website.

---

# 38. DOWNLOAD HOSTING

Use:

Cloudflare R2

Recommended domain:

downloads.nourish.app

Production storage:

R2 bucket:

nourish-mobile-releases

Folder structure:

android/
ios/
metadata/

Example:

android/Nourish-1.0.0.apk

ios/Nourish-1.0.0.ipa

metadata/latest.json

Configure the bucket behind the Nourish custom domain.

---

# 39. GITHUB RELEASES

GitHub Releases remain the canonical build archive.

Each release should contain:

Android APK
Android AAB
iOS IPA/archive if generated
SHA256 checksums
release notes

GitHub provides browser download URLs for release assets.

The website should use Cloudflare R2 for stable downloads and GitHub Releases as the fallback/archive.

---

# 40. ANDROID BUILD

Build:

flutter build apk --release

Prefer also:

flutter build appbundle --release

If possible generate:

arm64 APK
armeabi-v7a APK
x86_64 APK

The primary direct-download APK should be:

arm64.

The website may also provide a "More APKs" link.

---

# 41. ANDROID SIGNING

For production releases:

Use a secure Android keystore stored via GitHub Actions secrets.

Never commit:

keystore
password
private credentials

GitHub Secrets must contain:

ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD

The workflow creates the keystore during CI.

---

# 42. IOS BUILD

Use a macOS GitHub runner.

When Apple signing credentials are unavailable:

Build an unsigned iOS artifact where technically possible for development/archive purposes.

Label it:

UNSIGNED / DEVELOPMENT ARTIFACT

Do NOT advertise it as directly installable.

When Apple Developer Program credentials become available:

Add:

certificate
provisioning profile
App Store Connect API key

Then build a properly signed distribution IPA.

The workflow must support both modes.

---

# 43. IOS DISTRIBUTION

When Apple Developer credentials become available, support:

TestFlight
App Store distribution
Ad Hoc if appropriate
eligible alternative distribution where Apple permits it

Do not create fake installation links for an unsigned IPA.

---

# 44. GITHUB ACTIONS

Create workflows:

.github/workflows/build-release.yml

Trigger:

push tag:

v*

Manual workflow dispatch

Optional:

release branch merge

The workflow must:

1. Checkout repository.
2. Install Flutter.
3. Restore dependencies.
4. Run formatting checks.
5. Run static analysis.
6. Run tests.
7. Build Android APK.
8. Build Android AAB.
9. Build iOS artifact on macOS.
10. Calculate SHA256 hashes.
11. Create GitHub Release.
12. Upload binaries.
13. Optionally upload to Cloudflare R2.
14. Generate latest.json.
15. Update website download metadata.

---

# 45. RELEASE NAMING

Example:

Version:

1.0.0

Git tag:

v1.0.0

Assets:

Nourish-1.0.0-arm64.apk
Nourish-1.0.0-armeabi-v7a.apk
Nourish-1.0.0-x86_64.apk
Nourish-1.0.0.aab
Nourish-1.0.0-ios.ipa
SHA256SUMS.txt

---

# 46. RELEASE SAFETY

Do not publish a release if:

tests fail
analysis fails
build fails
required secrets are missing for a signed release

For unsigned iOS development builds, clearly mark them as unsigned.

---

# 47. CLOUDFLARE R2 UPLOAD

Use GitHub Actions secrets:

CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
R2_BUCKET_NAME
R2_PUBLIC_BASE_URL

Upload:

APK
AAB
IPA
checksums
latest.json

Configure:

downloads.nourish.app

The workflow must not expose secrets in logs.

---

# 48. LATEST.JSON

Automatically generate:

{
  "version": "1.0.0",
  "release_date": "2026-08-26",
  "android": {
    "available": true,
    "apk": "https://downloads.nourish.app/android/Nourish-1.0.0-arm64.apk",
    "aab": "https://downloads.nourish.app/android/Nourish-1.0.0.aab"
  },
  "ios": {
    "available": false,
    "ipa": null,
    "installable": false
  },
  "github_release": "https://github.com/OWNER/NOURISH/releases/tag/v1.0.0"
}

The website reads this file.

---

# 49. WEBSITE VERSION DETECTION

On Android:

Show:

DOWNLOAD APK

On iPhone/iPad:

If signed Apple distribution is available:

DOWNLOAD FOR IPHONE

Otherwise:

IPHONE VERSION COMING SOON

Show:

"Android is currently available for direct download. iOS distribution requires Apple signing and distribution approval."

On desktop:

Show:

GET NOURISH ON ANDROID
VIEW RELEASES

---

# 50. DOWNLOAD SECURITY

For every binary:

Calculate SHA256.

Publish hashes.

The website should display:

Version
Release date
File size
SHA256

This gives users a way to verify the downloaded binary.

---

# 51. UPDATE SYSTEM

The app should periodically request:

/releases/latest.json

Compare:

installed version
latest version

If a newer Android release exists:

"New version available."

CTA:

DOWNLOAD UPDATE

Do not silently install APKs.

Open the download URL.

---

# 52. WEBSITE DEPLOYMENT

Deploy:

apps/website

using a modern static/edge hosting provider.

The website must read release metadata dynamically.

Do not rebuild the website solely to publish a new APK.

---

# 53. ADMIN

Build:

apps/admin

for:

users
foods
recipes
products
AI reviews
subscriptions
payments
analytics
feature flags
audit logs

---

# 54. OBSERVABILITY

Track:

API errors
AI latency
AI costs
food recognition acceptance
food corrections
subscription conversions
payment failures
download clicks
download conversions
app activation
retention

---

# 55. ANALYTICS EVENTS

Create standard event names:

app_opened
onboarding_started
onboarding_completed
meal_scan_started
meal_scan_completed
meal_scan_failed
meal_confirmed
meal_corrected
food_added
food_deleted
recipe_created
water_logged
weight_logged
subscription_started
subscription_cancelled
download_clicked

Never send raw sensitive nutrition data to analytics unnecessarily.

---

# 56. TESTING

Create:

Unit tests
Integration tests
API tests
Database tests
AI schema tests
Payment tests
End-to-end tests
Flutter widget tests

Critical E2E:

Signup
Onboarding
Scan meal
Edit meal
Save meal
View dashboard
Subscribe
Payment verification
Account deletion
Data export

---

# 57. WEBSITE SEO

Create:

title
description
OpenGraph metadata
Twitter/X metadata
canonical URL
robots
sitemap

Target keywords naturally:

AI calorie tracker Ethiopia
Ethiopian calorie tracker
Ethiopian food nutrition
AI food scanner Ethiopia
calorie tracker Ethiopian food

Do not keyword-stuff.

---

# 58. WEBSITE LEGAL PAGES

Create:

Privacy Policy
Terms of Service
Cookie/Tracking Notice where appropriate
Health/Nutrition Disclaimer
Data Deletion

These must not be fake legal boilerplate.

Structure them so the actual business details can later be supplied.

---

# 59. SECURITY PRINCIPLES

Never commit:

API keys
AI keys
payment secrets
database credentials
signing keys
keystores
certificates

Use GitHub Secrets or a dedicated secret manager.

---

# 60. ENVIRONMENT CONFIGURATION

Create:

development
staging
production

Variables:

API_URL
DATABASE_URL
REDIS_URL
STORAGE_URL
AI_PROVIDER_KEY
PAYMENT_PROVIDER_KEYS
SENTRY_DSN
ANALYTICS_KEY
CLOUDFLARE_ACCOUNT_ID
R2_BUCKET_NAME

Never place secret values in source control.

---

# 61. CODE QUALITY

Require:

strict TypeScript
linting
formatting
Flutter analysis
typed API client
schema validation
clear error handling
tests

No TODO placeholders in critical functionality.

No fake API responses in production code.

---

# 62. MOBILE PERFORMANCE

Prioritize:

fast launch
cached dashboard
offline manual logging
compressed images
background synchronization
lazy API loading

Don't block the home screen on AI-related requests.

---

# 63. OFFLINE MODE

Offline:

food search from cached catalog
manual logging
water
weight
view history

Queued operations synchronize when connection returns.

---

# 64. WEBSITE DOWNLOAD UX

The website should have a prominent:

DOWNLOAD NOURISH

button.

When Android:

direct APK download.

When iOS distribution is unavailable:

clearly explain that iOS requires Apple's distribution/signing process.

Never present a raw unsigned IPA as an installable iPhone application.

---

# 65. IMPORTANT APPLE CONSTRAINT

The engineering system must understand:

An unsigned IPA is not equivalent to an installable iOS release.

Do not claim that an IPA on GitHub or R2 can be directly installed on arbitrary iPhones.

Once an Apple Developer account and signing credentials are available, integrate the correct Apple distribution channel.

---

# 66. FUTURE IOS AUTOMATION

Prepare GitHub Actions for:

macOS runner
certificate import
provisioning profile
App Store Connect API key
signed archive
IPA export
TestFlight upload

Keep signing logic isolated from Android logic.

---

# 67. RELEASE WORKFLOW FILES

Create:

.github/workflows/build-release.yml
.github/workflows/android-ci.yml
.github/workflows/website.yml
.github/workflows/api-ci.yml

Use reusable steps where sensible.

---

# 68. RELEASE PROCESS

Developer runs:

git tag v1.0.0
git push origin v1.0.0

GitHub Actions:

test
→ build
→ sign where credentials exist
→ checksum
→ GitHub Release
→ R2 upload
→ metadata update

The Nourish website automatically reflects the new version through latest.json.

---

# 69. FIRST RELEASE

The first production candidate should prioritize:

Authentication
Onboarding
Daily target
Home
Photo scanner
Ethiopian food recognition
Nutrition calculation
Manual correction
History
Weight
Water
Basic insights
Android release
Website
Download infrastructure

Do not delay the MVP for social features or advanced integrations.

---

# 70. LONG-TERM ROADMAP

Future:

Amharic
Afaan Oromo
HealthKit
Health Connect
Restaurant menus
Local product catalog
Gym partnerships
Coach accounts
Nutritionist accounts
Family plans
Restaurant partnerships
Corporate wellness
Personalized meal planning
Advanced Ethiopian food computer vision

---

# 71. FINAL RULE

Build Nourish as a real company-grade application.

Do not produce a prototype disguised as a production app.

Do not use fake functionality.

Do not leave dead buttons.

Do not copy competing products.

Do not pretend AI nutrition estimates are exact.

Use Ethiopian food intelligence as the product moat.

Follow the approved Stitch visual system exactly.

Create a complete automated build/release pipeline.

The final repository should be deployable, testable, observable, secure, and ready to evolve into a commercial product.

BEGIN IMPLEMENTATION.