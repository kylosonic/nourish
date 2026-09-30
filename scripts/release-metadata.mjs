/**
 * Release metadata for Nourish (REL-01 / REL-04, master §37, §48, §50).
 *
 * This module is the single place that decides what `latest.json` means:
 * building it from a directory of built artifacts, and validating that what it
 * says is true. It is shared by the release pipeline and by the tests, so the
 * contract cannot drift between the two.
 *
 * Honesty rules encoded here rather than left to a reviewer:
 *   - a binary is only linked when its SHA-256 is published (REL-04);
 *   - an unsigned iOS artifact is never `installable` and never gets a download
 *     link — an unsigned IPA is not an installable iPhone app (master §65);
 *   - "not published yet" is a real, representable state: no version, no links.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SCHEMA_VERSION = 1;

/** The canonical "nothing has been released" document. */
export function unpublished(repository = null) {
  return {
    schema_version: SCHEMA_VERSION,
    published: false,
    version: null,
    release_tag: null,
    release_date: null,
    android: {
      available: false,
      apk: null,
      universal_apk: null,
      aab: null,
    },
    ios: {
      available: false,
      installable: false,
      ipa: null,
      note: 'iOS distribution requires Apple signing and distribution approval.',
    },
    github_release: null,
    github_releases_url: repository
      ? `https://github.com/${repository}/releases`
      : null,
  };
}

export function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/** One published asset: URL, byte size and checksum — never a URL without a hash. */
export function describeAsset(filePath, publicBaseUrl, objectKey) {
  const stats = fs.statSync(filePath);
  if (!stats.isFile() || stats.size === 0) {
    throw new Error(`refusing to publish an empty or missing artifact: ${filePath}`);
  }
  const base = publicBaseUrl.replace(/\/+$/, '');
  return {
    url: `${base}/${objectKey.replace(/^\/+/, '')}`,
    size_bytes: stats.size,
    sha256: sha256File(filePath),
  };
}

/** Pick the first existing file among candidates; null when none exists. */
export function firstExisting(dir, names) {
  if (!dir) return null;
  for (const name of names) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Build the metadata document for one release.
 *
 * @param {object} options
 * @param {string} options.version        semantic version without the leading "v"
 * @param {string} options.tag            the git tag (e.g. "v1.0.0")
 * @param {string} options.releaseDate    ISO date (yyyy-mm-dd)
 * @param {string} options.publicBaseUrl  e.g. https://downloads.nourish.app
 * @param {string} [options.repository]   "owner/repo" for the GitHub release URL
 * @param {string} [options.androidDir]   directory holding the Android artifacts
 * @param {string} [options.iosDir]       directory holding the iOS artifacts
 * @param {boolean} [options.iosSigned]   true only for a genuinely signed build
 */
export function buildReleaseMetadata(options) {
  const {
    version,
    tag,
    releaseDate,
    publicBaseUrl,
    repository = null,
    androidDir = null,
    iosDir = null,
    iosSigned = false,
    // GitHub release assets are flat: every asset hangs off the release's
    // download URL with no directory of its own, so the object key must be the
    // bare filename. Other hosts (a CDN, object storage) keep the directory.
    flatAssets = false,
  } = options;

  if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`release version must be semver-like, got: ${version}`);
  }
  if (!tag) throw new Error('release tag is required');
  if (!publicBaseUrl) throw new Error('public base URL is required');

  const apk = firstExisting(androidDir, [
    `Nourish-${tag}-arm64.apk`,
    `Nourish-${version}-arm64.apk`,
  ]);
  const universal = firstExisting(androidDir, [
    `Nourish-${tag}-universal.apk`,
    `Nourish-${version}-universal.apk`,
  ]);
  const aab = firstExisting(androidDir, [
    `Nourish-${tag}.aab`,
    `Nourish-${version}.aab`,
  ]);
  const ipa = firstExisting(iosDir, [
    `Nourish-${tag}.ipa`,
    `Nourish-${version}.ipa`,
  ]);

  const androidAvailable = Boolean(apk || universal || aab);
  const document = unpublished(repository);
  document.published = true;
  document.version = version;
  document.release_tag = tag;
  document.release_date = releaseDate;
  document.android = {
    available: androidAvailable,
    apk: apk ? describeAsset(apk, publicBaseUrl, `${flatAssets ? '' : 'android/'}${path.basename(apk)}`) : null,
    universal_apk: universal
      ? describeAsset(universal, publicBaseUrl, `${flatAssets ? '' : 'android/'}${path.basename(universal)}`)
      : null,
    aab: aab ? describeAsset(aab, publicBaseUrl, `${flatAssets ? '' : 'android/'}${path.basename(aab)}`) : null,
  };
  // A signed iOS build is the ONLY way `installable` becomes true (master §65).
  const iosAvailable = Boolean(ipa) && iosSigned;
  document.ios = {
    available: iosAvailable,
    installable: iosAvailable,
    ipa: iosAvailable
      ? describeAsset(ipa, publicBaseUrl, `${flatAssets ? '' : 'ios/'}${path.basename(ipa)}`)
      : null,
    note: iosAvailable
      ? 'Signed distribution build.'
      : 'iOS distribution requires Apple signing and distribution approval.',
  };
  document.github_release = repository
    ? `https://github.com/${repository}/releases/tag/${tag}`
    : null;
  document.github_releases_url = repository
    ? `https://github.com/${repository}/releases`
    : null;
  return document;
}

/**
 * Validate a metadata document against the rules the website and the app rely
 * on. Returns a list of human-readable problems; empty means valid.
 */
export function validateReleaseMetadata(document) {
  const problems = [];
  const isObject = (value) => value !== null && typeof value === 'object';

  if (!isObject(document)) return ['metadata is not an object'];
  if (document.schema_version !== SCHEMA_VERSION) {
    problems.push(`unexpected schema_version: ${document.schema_version}`);
  }
  if (typeof document.published !== 'boolean') {
    problems.push('published must be a boolean');
  }

  if (document.published === false) {
    if (document.version !== null) problems.push('an unpublished document must not carry a version');
    if (document.android?.available) problems.push('an unpublished document must not offer Android');
    if (document.android?.apk) problems.push('an unpublished document must not link an APK');
    if (document.ios?.available || document.ios?.installable) {
      problems.push('an unpublished document must not offer iOS');
    }
    return problems;
  }

  if (typeof document.version !== 'string' || !document.version) {
    problems.push('a published document needs a version');
  }
  if (typeof document.release_date !== 'string' || !document.release_date) {
    problems.push('a published document needs a release date');
  }

  const checkAsset = (asset, label) => {
    if (asset == null) return;
    if (typeof asset.url !== 'string' || !asset.url.startsWith('https://')) {
      problems.push(`${label}: download URLs must be HTTPS`);
    }
    if (typeof asset.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(asset.sha256)) {
      // REL-04: a binary without a published checksum is never linked.
      problems.push(`${label}: missing or malformed sha256`);
    }
    if (!Number.isInteger(asset.size_bytes) || asset.size_bytes <= 0) {
      problems.push(`${label}: missing or implausible size_bytes`);
    }
  };

  if (document.android?.available) {
    checkAsset(document.android.apk, 'android.apk');
    checkAsset(document.android.universal_apk, 'android.universal_apk');
    checkAsset(document.android.aab, 'android.aab');
    if (!document.android.apk && !document.android.universal_apk && !document.android.aab) {
      problems.push('android.available is true but no asset is offered');
    }
  } else if (document.android?.apk) {
    problems.push('android.apk is linked while android.available is false');
  }

  // The hard rule: an unsigned iOS artifact is never presented as installable.
  if (document.ios?.installable && !document.ios?.ipa) {
    problems.push('ios.installable is true without an ipa asset');
  }
  if (!document.ios?.installable && document.ios?.ipa) {
    problems.push('ios.ipa is linked while ios.installable is false');
  }
  if (document.ios?.available && !document.ios?.installable) {
    problems.push('ios.available is true while ios.installable is false');
  }

  return problems;
}

/** Serialize deterministically so a re-run produces a byte-identical file. */
export function serializeReleaseMetadata(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}
