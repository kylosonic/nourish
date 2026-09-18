/**
 * Website download-logic tests (REL-02, REL-03, master §65).
 * Run with:  node --test apps/website/test/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPlatform,
  downloadPlan,
  formatBytes,
  isNewerVersion,
  listAssets,
} from '../assets/download-logic.mjs';

const PUBLISHED = {
  schema_version: 1,
  published: true,
  version: '1.0.0',
  release_tag: 'v1.0.0',
  release_date: '2026-09-19',
  android: {
    available: true,
    apk: {
      url: 'https://downloads.nourish.app/android/Nourish-v1.0.0-arm64.apk',
      size_bytes: 22_500_000,
      sha256: 'a'.repeat(64),
    },
    universal_apk: null,
    aab: {
      url: 'https://downloads.nourish.app/android/Nourish-v1.0.0.aab',
      size_bytes: 19_000_000,
      sha256: 'b'.repeat(64),
    },
  },
  ios: {
    available: false,
    installable: false,
    ipa: null,
    note: 'iOS distribution requires Apple signing and distribution approval.',
  },
  github_release: 'https://github.com/nourish-app/nourish/releases/tag/v1.0.0',
  github_releases_url: 'https://github.com/nourish-app/nourish/releases',
};

test('detects Android, iOS and desktop user agents', () => {
  assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)'), 'android');
  assert.equal(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'ios');
  assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
  assert.equal(detectPlatform(''), 'desktop');
});

test('an Android visitor gets the direct APK link from metadata', () => {
  const plan = downloadPlan('android', PUBLISHED);
  assert.equal(plan.kind, 'android-direct');
  assert.equal(plan.primaryLabel, 'DOWNLOAD APK');
  assert.equal(plan.primaryHref, PUBLISHED.android.apk.url);
  assert.match(plan.note, /1\.0\.0/);
});

test('an iPhone visitor without signed distribution is never offered a link', () => {
  const plan = downloadPlan('ios', PUBLISHED);
  assert.equal(plan.kind, 'ios-pending');
  assert.equal(plan.primaryLabel, 'IPHONE VERSION COMING SOON');
  assert.equal(plan.primaryHref, null, 'no download link may be rendered');
  assert.match(plan.note, /Apple signing/);
});

test('iPadOS reporting a desktop UA is treated as iOS', () => {
  const plan = downloadPlan('desktop', PUBLISHED, { isIpadOs: true });
  assert.equal(plan.platform, 'ios');
  assert.equal(plan.primaryHref, null);
});

test('a signed iOS release offers the iPhone download', () => {
  const signed = {
    ...PUBLISHED,
    ios: {
      available: true,
      installable: true,
      ipa: {
        url: 'https://downloads.nourish.app/ios/Nourish-v1.0.0.ipa',
        size_bytes: 30_000_000,
        sha256: 'c'.repeat(64),
      },
      note: 'Signed distribution build.',
    },
  };
  const plan = downloadPlan('ios', signed);
  assert.equal(plan.kind, 'ios-signed');
  assert.equal(plan.primaryLabel, 'DOWNLOAD FOR IPHONE');
  assert.equal(plan.primaryHref, signed.ios.ipa.url);
});

test('desktop visitors get the Android CTA plus releases', () => {
  const plan = downloadPlan('desktop', PUBLISHED);
  assert.equal(plan.kind, 'desktop');
  assert.equal(plan.primaryLabel, 'GET NOURISH ON ANDROID');
  assert.equal(plan.primaryHref, PUBLISHED.android.apk.url);
  assert.equal(plan.secondaryLabel, 'VIEW RELEASES');
  assert.equal(plan.secondaryHref, PUBLISHED.github_releases_url);
});

test('unreachable metadata degrades to GitHub Releases, never a stale link', () => {
  for (const metadata of [null, undefined, { published: false }]) {
    const plan = downloadPlan('android', metadata);
    assert.equal(plan.kind, 'unavailable');
    assert.equal(plan.primaryHref, PUBLISHED.github_releases_url);
    assert.equal(plan.assets.length, 0);
  }
});

test('asset rows carry version, date, size and checksum (master §50)', () => {
  const assets = listAssets(PUBLISHED);
  assert.equal(assets.length, 2);
  assert.equal(assets[0].size, '21.5 MB');
  assert.equal(assets[0].sha256, 'a'.repeat(64));
  assert.equal(assets[0].releaseDate, '2026-09-19');
  // An unsigned iOS artifact never appears in the list.
  assert.ok(!assets.some((a) => a.label.includes('iOS')));
});

test('formatBytes is honest about missing data', () => {
  assert.equal(formatBytes(undefined), '—');
  assert.equal(formatBytes(0), '—');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
});

test('version comparison is semantic and never prompts on a downgrade', () => {
  assert.equal(isNewerVersion('1.1.0', '1.0.0'), true);
  assert.equal(isNewerVersion('1.0.1', '1.0.0'), true);
  assert.equal(isNewerVersion('2.0.0', '1.9.9'), true);
  assert.equal(isNewerVersion('1.0.0', '1.0.0'), false);
  assert.equal(isNewerVersion('0.9.0', '1.0.0'), false);
  assert.equal(isNewerVersion(null, '1.0.0'), false);
  assert.equal(isNewerVersion('not-a-version', '1.0.0'), false);
});
