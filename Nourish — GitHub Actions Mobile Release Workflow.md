# .github/workflows/build-release.yml

name: Nourish Mobile Release

on:
  workflow_dispatch:

  push:
    tags:
      - "v*.*.*"

permissions:
  contents: write

env:
  FLUTTER_CHANNEL: stable

jobs:

  test:
    name: Test Flutter Application
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: ${{ env.FLUTTER_CHANNEL }}
          cache: true

      - name: Flutter pub get
        working-directory: apps/mobile
        run: flutter pub get

      - name: Analyze
        working-directory: apps/mobile
        run: flutter analyze

      - name: Tests
        working-directory: apps/mobile
        run: flutter test

  android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - name: Decode Android keystore
        if: ${{ secrets.ANDROID_KEYSTORE_BASE64 != '' }}
        working-directory: apps/mobile
        shell: bash
        run: |
          echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/app/upload-keystore.jks
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}

      - name: Flutter pub get
        working-directory: apps/mobile
        run: flutter pub get

      - name: Build universal release APK
        working-directory: apps/mobile
        run: flutter build apk --release

      - name: Build split release APKs
        working-directory: apps/mobile
        run: flutter build apk --release --split-per-abi

      - name: Build Android App Bundle
        working-directory: apps/mobile
        run: flutter build appbundle --release

      - name: Prepare Android artifacts
        shell: bash
        run: |
          mkdir -p release/android

          cp apps/mobile/build/app/outputs/flutter-apk/app-release.apk \
            release/android/Nourish-${GITHUB_REF_NAME}-universal.apk

          cp apps/mobile/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk \
            release/android/Nourish-${GITHUB_REF_NAME}-arm64.apk

          cp apps/mobile/build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk \
            release/android/Nourish-${GITHUB_REF_NAME}-armeabi-v7a.apk

          cp apps/mobile/build/app/outputs/flutter-apk/app-x86_64-release.apk \
            release/android/Nourish-${GITHUB_REF_NAME}-x86_64.apk

          cp apps/mobile/build/app/outputs/bundle/release/app-release.aab \
            release/android/Nourish-${GITHUB_REF_NAME}.aab

      - name: Generate SHA256 checksums
        working-directory: release/android
        run: |
          sha256sum * > SHA256SUMS.txt

      - name: Upload Android artifacts
        uses: actions/upload-artifact@v4
        with:
          name: nourish-android-${{ github.ref_name }}
          path: release/android

  ios:
    name: Build iOS Artifact
    runs-on: macos-latest
    needs: test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - name: Flutter pub get
        working-directory: apps/mobile
        run: flutter pub get

      # Development / archive-only mode.
      # This does not create a generally installable App Store IPA.
      - name: Build unsigned iOS IPA
        if: ${{ secrets.IOS_CERTIFICATE_BASE64 == '' }}
        working-directory: apps/mobile
        run: |
          flutter build ipa \
            --release \
            --no-codesign

      - name: Prepare unsigned iOS artifact
        if: ${{ secrets.IOS_CERTIFICATE_BASE64 == '' }}
        shell: bash
        run: |
          mkdir -p release/ios

          if [ -f apps/mobile/build/ios/ipa/*.ipa ]; then
            cp apps/mobile/build/ios/ipa/*.ipa \
              "release/ios/Nourish-${GITHUB_REF_NAME}-UNSIGNED.ipa"
          else
            echo "No unsigned IPA generated. Uploading archive instead."
            cp -R apps/mobile/build/ios/archive \
              "release/ios/Nourish-${GITHUB_REF_NAME}-UNSIGNED.xcarchive"
          fi

      # Production signing mode should be added once Apple Developer
      # Program credentials and provisioning assets are available.
      #
      # Expected secrets:
      # IOS_CERTIFICATE_BASE64
      # IOS_CERTIFICATE_PASSWORD
      # IOS_PROVISIONING_PROFILE_BASE64
      # IOS_KEYCHAIN_PASSWORD
      # APP_STORE_CONNECT_KEY_ID
      # APP_STORE_CONNECT_ISSUER_ID
      # APP_STORE_CONNECT_PRIVATE_KEY_BASE64
      #
      # Production flow:
      # 1. create temporary keychain
      # 2. import distribution certificate
      # 3. install provisioning profile
      # 4. configure signing
      # 5. archive
      # 6. export signed IPA
      # 7. optionally upload to TestFlight

      - name: Upload iOS artifact
        uses: actions/upload-artifact@v4
        with:
          name: nourish-ios-${{ github.ref_name }}
          path: release/ios

  release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs:
      - android
      - ios

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download Android artifacts
        uses: actions/download-artifact@v4
        with:
          name: nourish-android-${{ github.ref_name }}
          path: release/android

      - name: Download iOS artifacts
        uses: actions/download-artifact@v4
        with:
          name: nourish-ios-${{ github.ref_name }}
          path: release/ios

      - name: Generate release checksums
        shell: bash
        run: |
          find release -type f \
            \( -name "*.apk" -o -name "*.aab" -o -name "*.ipa" \) \
            -print0 |
            xargs -0 sha256sum > release/SHA256SUMS.txt

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          generate_release_notes: true
          files: |
            release/android/*.apk
            release/android/*.aab
            release/ios/*
            release/SHA256SUMS.txt

  publish-r2:
    name: Publish Release Files To Cloudflare R2
    runs-on: ubuntu-latest
    needs: release

    steps:
      - name: Download Android artifacts
        uses: actions/download-artifact@v4
        with:
          name: nourish-android-${{ github.ref_name }}
          path: release/android

      - name: Download iOS artifacts
        uses: actions/download-artifact@v4
        with:
          name: nourish-ios-${{ github.ref_name }}
          path: release/ios

      - name: Download Cloudflare Wrangler
        run: npm install -g wrangler

      - name: Upload Android files
        shell: bash
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
        run: |
          for file in release/android/*; do
            filename=$(basename "$file")

            wrangler r2 object put \
              "${R2_BUCKET_NAME}/android/${filename}" \
              --file "$file" \
              --content-type "$(file --mime-type -b "$file")"
          done

      - name: Upload iOS files
        shell: bash
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
        run: |
          for file in release/ios/*; do
            filename=$(basename "$file")

            wrangler r2 object put \
              "${R2_BUCKET_NAME}/ios/${filename}" \
              --file "$file" \
              --content-type "$(file --mime-type -b "$file")"
          done

      - name: Generate latest.json
        shell: bash
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
          R2_PUBLIC_BASE_URL: ${{ secrets.R2_PUBLIC_BASE_URL }}
        run: |
          cat > latest.json <<EOF
          {
            "version": "${GITHUB_REF_NAME#v}",
            "release_tag": "${GITHUB_REF_NAME}",
            "android": {
              "available": true,
              "apk": "${R2_PUBLIC_BASE_URL}/android/Nourish-${GITHUB_REF_NAME}-arm64.apk",
              "universal_apk": "${R2_PUBLIC_BASE_URL}/android/Nourish-${GITHUB_REF_NAME}-universal.apk",
              "aab": "${R2_PUBLIC_BASE_URL}/android/Nourish-${GITHUB_REF_NAME}.aab"
            },
            "ios": {
              "available": false,
              "installable": false
            },
            "github_release": "https://github.com/${GITHUB_REPOSITORY}/releases/tag/${GITHUB_REF_NAME}"
          }
          EOF

          wrangler r2 object put \
            "${R2_BUCKET_NAME}/metadata/latest.json" \
            --file latest.json \
            --content-type "application/json"

      - name: Print release information
        run: |
          echo "Nourish release: ${GITHUB_REF_NAME}"
          echo "Android download:"
          echo "${{ secrets.R2_PUBLIC_BASE_URL }}/android/Nourish-${GITHUB_REF_NAME}-arm64.apk"
          echo "GitHub Release:"
          echo "https://github.com/${GITHUB_REPOSITORY}/releases/tag/${GITHUB_REF_NAME}"