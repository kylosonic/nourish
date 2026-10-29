/**
 * Download-area decisions for the Nourish website (REL-02, master §36, §49,
 * §64, §65).
 *
 * Pure functions on purpose: the rules below include a hard product rule (an
 * unsigned IPA is never presented as an installable iPhone app) and a
 * degradation rule (unreachable metadata falls back to GitHub Releases, never
 * to a stale hardcoded link). Keeping them out of the DOM means they are
 * testable, which is the only reason to trust them.
 */

/** @typedef {'android' | 'ios' | 'desktop'} Platform */

export const GITHUB_RELEASES_FALLBACK = 'https://github.com/kylosonic/nourish/releases';

function assetUrl(asset) {
  const url = asset?.browser_download_url ?? asset?.url;
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : null;
}

function unavailablePlan(platform, releasesUrl) {
  return {
    kind: 'unavailable',
    platform,
    primaryLabel: 'DOWNLOAD APK',
    primaryHref: null,
    secondaryLabel: 'VIEW RELEASES',
    secondaryHref: releasesUrl,
    note: 'Latest build available on GitHub Releases.',
    assets: [],
  };
}

/** Detect the visitor's platform from a user agent string. */
export function detectPlatform(userAgent) {
  const ua = String(userAgent ?? '').toLowerCase();
  if (/android/.test(ua)) return 'android';
  // iPadOS 13+ reports a desktop UA; the touch-point check is done in the caller
  // and passed in via `isIpadOs`.
  if (/iphone|ipod|ipad/.test(ua)) return 'ios';
  return 'desktop';
}

/**
 * @param {Platform} platform
 * @param {object|null} metadata   the parsed latest.json, or null when unreachable
 * @param {object} [options]
 * @param {string} [options.githubReleasesUrl]
 * @param {boolean} [options.isIpadOs]  iPadOS reporting a desktop UA
 */
export function downloadPlan(platform, metadata, options = {}) {
  const releasesUrl =
    metadata?.github_releases_url ||
    options.githubReleasesUrl ||
    GITHUB_RELEASES_FALLBACK;

  // Metadata unreachable or nothing published yet: keep the releases link usable.
  if (!metadata || metadata.published !== true) {
    return unavailablePlan(platform, releasesUrl);
  }

  const apk = metadata.android?.apk ?? metadata.android?.universal_apk ?? null;
  const apkUrl = assetUrl(apk);
  if (metadata.android?.available !== true || !apkUrl) {
    return unavailablePlan(platform, releasesUrl);
  }

  const assets = listAssets(metadata);

  if (platform === 'android') {
    return {
      kind: 'android-direct',
      platform,
      primaryLabel: 'DOWNLOAD APK',
      primaryHref: apkUrl,
      secondaryLabel: 'MORE DOWNLOADS',
      secondaryHref: releasesUrl,
      note: `Android ${metadata.version} — direct download. Verify the SHA-256 below before installing.`,
      assets,
    };
  }

  if (platform === 'ios' || options.isIpadOs) {
    // The hard rule: no signed Apple distribution means no install link.
    if (metadata.ios?.installable && metadata.ios?.ipa) {
      return {
        kind: 'ios-signed',
        platform: 'ios',
        primaryLabel: 'DOWNLOAD FOR IPHONE',
        primaryHref: metadata.ios.ipa.url,
        secondaryLabel: 'VIEW RELEASES',
        secondaryHref: releasesUrl,
        note: 'Signed iOS distribution build.',
        assets,
      };
    }
    return {
      kind: 'ios-pending',
      platform: 'ios',
      primaryLabel: 'IPHONE VERSION COMING SOON',
      primaryHref: null,
      secondaryLabel: 'VIEW RELEASES',
      secondaryHref: releasesUrl,
      note:
        metadata.ios?.note ||
        'iOS distribution requires Apple signing and distribution approval. ' +
          'An unsigned build cannot be installed on an iPhone.',
      assets,
    };
  }

  return {
    kind: 'desktop',
    platform: 'desktop',
    primaryLabel: 'GET NOURISH ON ANDROID',
    primaryHref: apkUrl,
    secondaryLabel: 'VIEW RELEASES',
    secondaryHref: releasesUrl,
    note: `Android ${metadata.version} — direct download. ${
      metadata.ios?.installable
        ? 'iOS is also available.'
        : 'iOS requires Apple signing.'
    }`,
    assets,
  };
}

/** Version / date / size / checksum rows the page prints (master §50). */
export function listAssets(metadata) {
  if (!metadata || metadata.published !== true) return [];
  const rows = [];
  const push = (label, asset) => {
    const url = assetUrl(asset);
    if (!url) return;
    rows.push({
      label,
      url,
      size: formatBytes(asset.size_bytes),
      sha256: asset.sha256 ?? asset.digest?.replace(/^sha256:/i, '') ?? '—',
      version: metadata.version,
      releaseDate: metadata.release_date,
    });
  };
  push('Android APK (arm64)', metadata.android?.apk);
  if (metadata.android?.universal_apk) {
    push('Android APK (universal)', metadata.android.universal_apk);
  }
  push('Android App Bundle', metadata.android?.aab);
  if (metadata.ios?.installable) push('iOS (signed)', metadata.ios.ipa);
  return rows;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/**
 * Semantic version comparison for the in-app update check (REL-03): a
 * downgraded metadata document must never prompt, so the comparison is
 * component-wise and never string-based.
 */
export function isNewerVersion(latest, installed) {
  const parse = (value) =>
    String(value ?? '')
      .split(/[.+-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0));
  const a = parse(latest);
  const b = parse(installed);
  if (a.length < 3 || b.length < 3) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}
