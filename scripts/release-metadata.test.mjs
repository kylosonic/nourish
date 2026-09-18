/**
 * Tests for the release metadata contract (REL-01 / REL-04, master §48, §50,
 * §65). Run with:  node --test scripts/
 *
 * These are the rules the website and the in-app update check depend on, so
 * they are asserted here rather than discovered in production.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  SCHEMA_VERSION,
  buildReleaseMetadata,
  serializeReleaseMetadata,
  sha256File,
  unpublished,
  validateReleaseMetadata,
} from './release-metadata.mjs';

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nourish-release-'));
}

function writeArtifact(dir, name, bytes) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, bytes);
  return file;
}

const BASE = {
  version: '1.0.0',
  tag: 'v1.0.0',
  releaseDate: '2026-09-19',
  publicBaseUrl: 'https://downloads.nourish.app',
  repository: 'nourish-app/nourish',
};

test('an unpublished document is valid and links nothing', () => {
  const document = unpublished('nourish-app/nourish');
  assert.equal(document.published, false);
  assert.equal(document.version, null);
  assert.equal(document.android.available, false);
  assert.equal(document.android.apk, null);
  assert.equal(document.ios.installable, false);
  assert.deepEqual(validateReleaseMetadata(document), []);
});

test('a published Android release carries url + size + sha256 for every asset', () => {
  const dir = tempDir();
  const android = path.join(dir, 'android');
  writeArtifact(android, 'Nourish-v1.0.0-arm64.apk', 'apk-bytes');
  writeArtifact(android, 'Nourish-v1.0.0.aab', 'aab-bytes');

  const document = buildReleaseMetadata({ ...BASE, androidDir: android });
  assert.deepEqual(validateReleaseMetadata(document), []);
  assert.equal(document.published, true);
  assert.equal(document.version, '1.0.0');
  assert.equal(document.schema_version, SCHEMA_VERSION);
  assert.equal(
    document.android.apk.url,
    'https://downloads.nourish.app/android/Nourish-v1.0.0-arm64.apk',
  );
  assert.equal(document.android.apk.size_bytes, 'apk-bytes'.length);
  assert.equal(document.android.apk.sha256, sha256File(path.join(android, 'Nourish-v1.0.0-arm64.apk')));
  assert.equal(document.android.aab.sha256.length, 64);
  assert.equal(
    document.github_release,
    'https://github.com/nourish-app/nourish/releases/tag/v1.0.0',
  );
});

test('an unsigned iOS artifact is never installable or linked (master §65)', () => {
  const dir = tempDir();
  const android = path.join(dir, 'android');
  const ios = path.join(dir, 'ios');
  writeArtifact(android, 'Nourish-v1.0.0-arm64.apk', 'apk');
  writeArtifact(ios, 'Nourish-v1.0.0-UNSIGNED.ipa', 'unsigned-ipa');

  const unsigned = buildReleaseMetadata({ ...BASE, androidDir: android, iosDir: ios });
  assert.equal(unsigned.ios.available, false);
  assert.equal(unsigned.ios.installable, false);
  assert.equal(unsigned.ios.ipa, null, 'an unsigned IPA must never be linked');
  assert.match(unsigned.ios.note, /Apple signing/);
  assert.deepEqual(validateReleaseMetadata(unsigned), []);

  // Asking for the signed path while only an unsigned artifact exists must NOT
  // produce an installable iOS link — the flag is a claim, the artifact decides.
  const claimed = buildReleaseMetadata({
    ...BASE,
    androidDir: android,
    iosDir: ios,
    iosSigned: true,
  });
  assert.equal(claimed.ios.installable, false);
  assert.equal(claimed.ios.ipa, null);
  assert.deepEqual(validateReleaseMetadata(claimed), []);

  // A genuinely signed distribution IPA (master §45 naming) is the only path.
  writeArtifact(ios, 'Nourish-v1.0.0.ipa', 'signed-ipa');
  const signed = buildReleaseMetadata({
    ...BASE,
    androidDir: android,
    iosDir: ios,
    iosSigned: true,
  });
  assert.equal(signed.ios.available, true);
  assert.equal(signed.ios.installable, true);
  assert.ok(signed.ios.ipa.sha256);
  assert.match(signed.ios.ipa.url, /ios\/Nourish-v1\.0\.0\.ipa$/);
  assert.deepEqual(validateReleaseMetadata(signed), []);
});

test('a release with no artifacts is representable but offers nothing', () => {
  const document = buildReleaseMetadata({ ...BASE, androidDir: null, iosDir: null });
  assert.equal(document.android.available, false);
  assert.equal(document.android.apk, null);
  assert.deepEqual(validateReleaseMetadata(document), []);
});

test('validation rejects a linked binary without a checksum (REL-04)', () => {
  const document = buildReleaseMetadata({ ...BASE });
  document.android.available = true;
  document.android.apk = { url: 'https://downloads.nourish.app/x.apk', size_bytes: 10 };
  const problems = validateReleaseMetadata(document);
  assert.ok(problems.some((p) => p.includes('sha256')));
});

test('validation rejects an installable iOS claim without a signed asset', () => {
  const document = buildReleaseMetadata({ ...BASE });
  document.ios.installable = true;
  document.ios.available = true;
  const problems = validateReleaseMetadata(document);
  assert.ok(problems.some((p) => p.includes('ios.installable')));
});

test('validation rejects non-HTTPS download URLs and unpublished versions', () => {
  const document = buildReleaseMetadata({ ...BASE });
  document.android.available = true;
  document.android.apk = { url: 'http://insecure/x.apk', size_bytes: 5, sha256: 'a'.repeat(64) };
  assert.ok(validateReleaseMetadata(document).some((p) => p.includes('HTTPS')));

  const bad = unpublished();
  bad.version = '1.0.0';
  assert.ok(validateReleaseMetadata(bad).some((p) => p.includes('must not carry a version')));
});

test('an empty artifact is refused rather than published', () => {
  const dir = tempDir();
  const android = path.join(dir, 'android');
  writeArtifact(android, 'Nourish-v1.0.0-arm64.apk', '');
  assert.throws(
    () => buildReleaseMetadata({ ...BASE, androidDir: android }),
    /empty or missing artifact/,
  );
});

test('generation is deterministic: the same inputs produce identical bytes', () => {
  const dir = tempDir();
  const android = path.join(dir, 'android');
  writeArtifact(android, 'Nourish-v1.0.0-arm64.apk', 'apk');
  const first = serializeReleaseMetadata(buildReleaseMetadata({ ...BASE, androidDir: android }));
  const second = serializeReleaseMetadata(buildReleaseMetadata({ ...BASE, androidDir: android }));
  assert.equal(first, second);
  // A non-semver version is refused outright.
  assert.throws(() => buildReleaseMetadata({ ...BASE, version: 'latest' }), /semver-like/);
});
