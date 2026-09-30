#!/usr/bin/env node
/**
 * Generate (or check) `releases/latest.json` — the release metadata the website
 * and the app read (REL-01).
 *
 *   node scripts/generate-latest-json.mjs \
 *     --version 1.0.0 --tag v1.0.0 --date 2026-09-19 \
 *     --base-url https://downloads.nourish.app \
 *     --repository owner/nourish \
 *     --android-dir release/android --ios-dir release/ios \
 *     [--ios-signed] [--out releases/latest.json]
 *
 *   node scripts/generate-latest-json.mjs --check releases/latest.json
 *
 * With no artifacts present it writes the honest "nothing published" document
 * rather than inventing links. `--check` validates an existing file and exits
 * non-zero on any violation, so the pipeline and CI can gate on it.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildReleaseMetadata,
  serializeReleaseMetadata,
  unpublished,
  validateReleaseMetadata,
} from './release-metadata.mjs';

function parseArgs(argv) {
  const args = {};
  const booleanFlags = new Set(['ios-signed', 'check', 'flat-assets']);
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (booleanFlags.has(key) && (next === undefined || next.startsWith('--'))) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i++;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

// parseArgs keys flags by their raw text ('flat-assets'), while the call sites
// below read camelCase ('flatAssets'). Without this, a boolean flag was silently
// ignored -- which is why --ios-signed never had any effect either.
for (const flag of ['ios-signed', 'flat-assets']) {
  if (args[flag] === true) {
    args[flag.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
  }
}
const defaultOut = path.resolve(import.meta.dirname, '../releases/latest.json');

if (args.check) {
  const target = args.check === true ? defaultOut : path.resolve(args.check);
  const document = JSON.parse(fs.readFileSync(target, 'utf8'));
  const problems = validateReleaseMetadata(document);
  if (problems.length) {
    console.error(`INVALID ${target}`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `OK ${target} — published=${document.published}` +
      (document.published ? ` version=${document.version}` : '') +
      `, android=${document.android.available}, ios_installable=${document.ios.installable}`,
  );
  process.exit(0);
}

const out = args.out ? path.resolve(args.out) : defaultOut;
const repository = args.repository ?? process.env.GITHUB_REPOSITORY ?? null;

let document;
if (!args.version) {
  // No version means no release: never fabricate one.
  document = unpublished(repository);
  console.log('no --version supplied: writing the "not published" document');
} else {
  document = buildReleaseMetadata({
    version: args.version.replace(/^v/, ''),
    tag: args.tag ?? `v${args.version.replace(/^v/, '')}`,
    releaseDate: args.date ?? new Date().toISOString().slice(0, 10),
    publicBaseUrl: args['base-url'] ?? '',
    repository,
    androidDir: args['android-dir'] ? path.resolve(args['android-dir']) : null,
    iosDir: args['ios-dir'] ? path.resolve(args['ios-dir']) : null,
    iosSigned: Boolean(args.iosSigned),
    flatAssets: Boolean(args.flatAssets),
  });
}

const problems = validateReleaseMetadata(document);
if (problems.length) {
  console.error('refusing to write invalid release metadata:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, serializeReleaseMetadata(document), 'utf8');
console.log(`wrote ${out}`);
console.log(serializeReleaseMetadata(document).trimEnd());
