/**
 * Website runtime (REL-02).
 *
 * Reads the release metadata at runtime and renders the download area for the
 * visitor's device. All decisions live in ./download-logic.mjs, which is unit
 * tested; this file only touches the DOM.
 *
 * The metadata URL is configurable so the same static build works locally
 * (releases/latest.json in this repository) and in production (the canonical
 * metadata file on the downloads host) with no rebuild — publishing an APK must
 * never require editing or redeploying the site (master §52).
 */
import { detectPlatform, downloadPlan, formatBytes } from './download-logic.mjs';

/**
 * Where the release metadata lives, in order of preference:
 *   1. `latest.json` next to the site — the deploy step copies the canonical
 *      metadata file into the site root, so the page and the file are always
 *      published together;
 *   2. `../releases/latest.json` — the same document in the repository, which is
 *      what a local preview serves.
 * If neither is reachable the download area degrades to the releases page
 * (REL-02) rather than showing a stale link.
 */
const METADATA_URLS = ['latest.json', '../releases/latest.json'];

const FALLBACK_RELEASES = 'https://github.com/nourish-app/nourish/releases';

function isIpadOs() {
  return (
    /macintosh/.test(navigator.userAgent.toLowerCase()) && navigator.maxTouchPoints > 1
  );
}

async function loadMetadata() {
  for (const url of METADATA_URLS) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // Try the next location; the caller renders the fallback if none work.
    }
  }
  return null;
}

function render(metadata) {
  const platform = detectPlatform(navigator.userAgent);
  const plan = downloadPlan(platform, metadata, {
    githubReleasesUrl: FALLBACK_RELEASES,
    isIpadOs: isIpadOs(),
  });

  const panel = document.getElementById('download-panel');
  const note = document.getElementById('download-note');
  const primary = document.getElementById('download-primary');
  const secondary = document.getElementById('download-secondary');

  if (!panel || !note || !primary || !secondary) return;

  panel.dataset.state = plan.kind;
  note.textContent = plan.note;

  primary.textContent = plan.primaryLabel;
  if (plan.primaryHref) {
    primary.href = plan.primaryHref;
    primary.hidden = false;
    // A download link opens the file; a releases link is a normal navigation.
    primary.setAttribute('rel', 'noopener');
  } else {
    // No link is rendered at all: never a button that leads nowhere.
    primary.removeAttribute('href');
    primary.setAttribute('aria-disabled', 'true');
    primary.hidden = false;
  }

  if (plan.secondaryHref && plan.secondaryLabel) {
    secondary.textContent = plan.secondaryLabel;
    secondary.href = plan.secondaryHref;
    secondary.hidden = false;
  } else {
    secondary.hidden = true;
  }

  const releasesLink = document.getElementById('footer-releases');
  if (releasesLink && metadata?.github_releases_url) {
    releasesLink.href = metadata.github_releases_url;
  }

  renderAssets(plan.assets);
}

function renderAssets(assets) {
  const table = document.getElementById('download-assets');
  if (!table) return;
  const body = table.querySelector('tbody');
  if (!body || assets.length === 0) {
    table.hidden = true;
    return;
  }
  body.replaceChildren(
    ...assets.map((asset) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const link = document.createElement('a');
      link.href = asset.url;
      link.textContent = asset.label;
      link.rel = 'noopener';
      name.append(link);

      const version = document.createElement('td');
      version.textContent = `${asset.version} · ${asset.releaseDate}`;

      const size = document.createElement('td');
      size.textContent = asset.size;

      const sha = document.createElement('td');
      sha.className = 'sha';
      sha.textContent = asset.sha256;

      row.append(name, version, size, sha);
      return row;
    }),
  );
  table.hidden = false;
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

loadMetadata().then(render);
