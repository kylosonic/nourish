/**
 * Cross-module contract: the document the release pipeline generates must be
 * what the website renders. These two live in different directories and are
 * edited by different concerns, so the seam between them is asserted here
 * rather than assumed.
 *
 * Run with:  node --test apps/website/test/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildReleaseMetadata,
  serializeReleaseMetadata,
  validateReleaseMetadata,
} from '../../../scripts/release-metadata.mjs';
import { downloadPlan, listAssets } from '../assets/download-logic.mjs';

function androidArtifacts() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nourish-site-'));
  const android = path.join(dir, 'android');
  fs.mkdirSync(android, { recursive: true });
  fs.writeFileSync(path.join(android, 'Nourish-v1.2.3-arm64.apk'), 'apk-payload');
  fs.writeFileSync(path.join(android, 'Nourish-v1.2.3.aab'), 'aab-payload');
  return android;
}

test('a generated document is valid and drives every platform correctly', () => {
  const androidDir = androidArtifacts();
  const document = buildReleaseMetadata({
    version: '1.2.3',
    tag: 'v1.2.3',
    releaseDate: '2026-09-19',
    publicBaseUrl: 'https://downloads.nourish.app',
    repository: 'nourish-app/nourish',
    androidDir,
    iosDir: null,
  });

  assert.deepEqual(validateReleaseMetadata(document), []);

  // Round-trip through the wire format: what the website fetches is JSON text.
  const roundTripped = JSON.parse(serializeReleaseMetadata(document));

  const android = downloadPlan('android', roundTripped);
  assert.equal(android.kind, 'android-direct');
  assert.equal(
    android.primaryHref,
    'https://downloads.nourish.app/android/Nourish-v1.2.3-arm64.apk',
  );

  const ios = downloadPlan('ios', roundTripped);
  assert.equal(ios.kind, 'ios-pending');
  assert.equal(ios.primaryHref, null);

  const desktop = downloadPlan('desktop', roundTripped);
  assert.equal(desktop.kind, 'desktop');
  assert.equal(desktop.primaryHref, android.primaryHref);

  const assets = listAssets(roundTripped);
  assert.equal(assets.length, 2);
  for (const asset of assets) {
    assert.match(asset.sha256, /^[0-9a-f]{64}$/);
    assert.notEqual(asset.size, '—');
    assert.equal(asset.version, '1.2.3');
  }
});

test('the committed latest.json is valid and renders the honest empty state', () => {
  const committed = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, '../../../releases/latest.json'), 'utf8'),
  );
  assert.deepEqual(validateReleaseMetadata(committed), []);
  // Nothing has been released yet, so every platform degrades to the releases page.
  for (const platform of ['android', 'ios', 'desktop']) {
    const plan = downloadPlan(platform, committed);
    assert.equal(plan.kind, 'unavailable');
    assert.equal(plan.assets.length, 0);
    assert.ok(plan.primaryHref.includes('/releases'));
  }
});
