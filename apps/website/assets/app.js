/**
 * Nourish website runtime.
 *
 * Release decisions live in download-logic.mjs so the Android/iOS rules remain
 * unit-tested. This module only connects those decisions and the page's small
 * demonstrations to the DOM.
 */
import { detectPlatform, downloadPlan } from './download-logic.mjs';

const METADATA_URLS = [
  'latest.json',
  '../../releases/latest.json',
  '../releases/latest.json',
];

const FALLBACK_RELEASES = 'https://github.com/kylosonic/nourish/releases';

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

function setInitialReleaseLink() {
  const releasesLink = document.getElementById('footer-releases');
  if (releasesLink) releasesLink.href = FALLBACK_RELEASES;
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
    primary.removeAttribute('aria-disabled');
    primary.setAttribute('rel', 'noopener');
  } else {
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
  if (releasesLink) {
    releasesLink.href = metadata?.github_releases_url || FALLBACK_RELEASES;
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

  const labels = ['File', 'Version', 'Size', 'SHA-256'];
  body.replaceChildren(
    ...assets.map((asset) => {
      const row = document.createElement('tr');

      const name = document.createElement('td');
      name.dataset.label = labels[0];
      const link = document.createElement('a');
      link.href = asset.url;
      link.textContent = asset.label;
      link.rel = 'noopener';
      name.append(link);

      const version = document.createElement('td');
      version.dataset.label = labels[1];
      version.textContent = `${asset.version} · ${asset.releaseDate}`;

      const size = document.createElement('td');
      size.dataset.label = labels[2];
      size.textContent = asset.size;

      const sha = document.createElement('td');
      sha.dataset.label = labels[3];
      sha.className = 'sha';
      sha.textContent = asset.sha256;

      row.append(name, version, size, sha);
      return row;
    }),
  );
  table.hidden = false;
}

function updateDock(sectionId) {
  const validIds = new Set(['top', 'tour', 'grams', 'data', 'download']);
  if (!validIds.has(sectionId)) return;

  document.querySelectorAll('[data-dock-link]').forEach((link) => {
    const isActive = link.dataset.dockLink === sectionId;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function observeDock() {
  const links = [...document.querySelectorAll('[data-dock-link]')];
  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const sections = links
    .map((link) => document.getElementById(link.dataset.dockLink))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) updateDock(visible.target.id);
    },
    {
      rootMargin: '-38% 0px -50% 0px',
      threshold: [0, 0.2, 0.5],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function syncTourStage(step) {
  const shot = step.dataset.shot;
  const stageImages = [...document.querySelectorAll('.tour-stage [data-shot]')];
  const stageIndex = document.querySelector('[data-stage-index]');
  const stepNumber = step.dataset.step?.padStart(2, '0') || '01';

  document.querySelectorAll('.tour-step').forEach((item) => {
    item.classList.toggle('is-active', item === step);
  });

  stageImages.forEach((image) => {
    const isActive = image.dataset.shot === shot;
    image.classList.toggle('is-active', isActive);
    image.toggleAttribute('aria-hidden', !isActive);
    const activeAlt =
      shot === 'scan'
        ? 'Overhead photo of a shared Ethiopian meal, ready to scan.'
        : shot === 'track'
          ? 'Nourish insights screen showing weekly calories and macro totals.'
          : 'Nourish scan result showing the meal, confidence, macros, and detected ingredients.';
    image.alt = isActive ? activeAlt : '';
  });

  if (stageIndex) stageIndex.textContent = `${stepNumber} / 03`;
}

function observeTour() {
  const steps = [...document.querySelectorAll('.tour-step')];
  if (steps.length === 0 || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) syncTourStage(visible.target);
    },
    { rootMargin: '-30% 0px -48% 0px', threshold: [0, 0.3, 0.6] },
  );

  steps.forEach((step) => observer.observe(step));
}

function connectPortionPreview() {
  const slider = document.getElementById('portion-range');
  const weight = document.getElementById('portion-weight');
  if (!(slider instanceof HTMLInputElement) || !weight) return;

  const baselineGrams = 420;
  const baseline = {
    calories: 820,
    protein: 42,
    carbs: 86,
    fat: 31,
  };

  const fields = new Map(
    Object.keys(baseline).map((key) => [
      key,
      document.querySelector(`[data-nutrition="${key}"]`),
    ]),
  );

  const update = () => {
    const grams = Number.parseInt(slider.value, 10);
    const ratio = grams / baselineGrams;
    weight.value = `${grams} g`;
    weight.textContent = `${grams} g`;

    for (const [key, field] of fields) {
      if (field) field.textContent = String(Math.round(baseline[key] * ratio));
    }

    slider.setAttribute(
      'aria-valuetext',
      `${grams} grams; ${Math.round(baseline.calories * ratio)} calories in the sample plate`,
    );
  };

  slider.addEventListener('input', update);
  update();
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

setInitialReleaseLink();
observeDock();
observeTour();
connectPortionPreview();
loadMetadata().then(render);
