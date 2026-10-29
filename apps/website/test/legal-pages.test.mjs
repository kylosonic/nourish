import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function page(name) {
  return fs.readFileSync(path.join(webRoot, name), 'utf8');
}

test('store-facing legal pages contain no unresolved publication placeholders', () => {
  for (const name of [
    'privacy.html',
    'terms.html',
    'support.html',
    'data-deletion.html',
    'cookies.html',
    'health-disclaimer.html',
  ]) {
    const html = page(name);
    assert.doesNotMatch(html, /\[to be supplied\]/i, name);
  }
});

test('support page provides account-deletion and privacy routes', () => {
  const html = page('support.html');
  assert.match(html, /id="deletion-request-form"/);
  assert.match(html, /account-deletion-requests/);
  assert.match(html, /profile → settings → delete account/i);
  assert.match(html, /privacy\.html/);
});
