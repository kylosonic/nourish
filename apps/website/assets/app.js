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
  } else if (plan.kind === 'ios-pending') {
    primary.removeAttribute('href');
    primary.setAttribute('aria-disabled', 'true');
    primary.hidden = false;
  } else {
    primary.removeAttribute('href');
    primary.removeAttribute('aria-disabled');
    primary.hidden = true;
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
  const validIds = new Set(['top', 'tour', 'grams', 'data', 'faq', 'download']);
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

  positionDockIndicator();
}

function positionDockIndicator() {
  const dock = document.querySelector('.store-dock');
  const indicator = document.querySelector('[data-dock-indicator]');
  const activeItem = document.querySelector('.store-dock__item.is-active');
  if (!dock || !indicator || !activeItem) {
    if (indicator) indicator.style.opacity = '0';
    return;
  }

  const dockRect = dock.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  indicator.style.width = `${itemRect.width}px`;
  indicator.style.transform = `translateX(${itemRect.left - dockRect.left}px)`;
  indicator.style.opacity = '1';
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

  const dock = document.querySelector('.store-dock');
  if (dock && 'ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(positionDockIndicator);
    resizeObserver.observe(dock);
  }
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
        ? 'Nourish add-meal screen with camera, photo, search, and barcode choices.'
        : shot === 'track'
          ? 'Nourish insights screen with a weekly summary and a prompt to log meals before trends appear.'
          : 'Nourish scan result showing the meal, confidence, macros, and detected ingredients.';
    image.alt = isActive ? activeAlt : '';
  });

  if (stageIndex) stageIndex.textContent = `${stepNumber} / 03`;
}

function observeTour() {
  const steps = [...document.querySelectorAll('.tour-step')];
  if (steps.length === 0) return;

  let frame = 0;
  let currentStep = null;
  const updateActiveStep = () => {
    frame = 0;
    const activationLine = window.innerHeight * 0.46;
    const activeStep = steps.reduce((closest, step) => {
      const rect = step.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - activationLine);
      return !closest || distance < closest.distance
        ? { step, distance }
        : closest;
    }, null);

    if (!activeStep || activeStep.step === currentStep) return;

    if (currentStep) {
      const rect = currentStep.getBoundingClientRect();
      const currentDistance = Math.abs(
        rect.top + rect.height / 2 - activationLine,
      );
      if (currentDistance <= activeStep.distance + 32) return;
    }

    currentStep = activeStep.step;
    syncTourStage(currentStep);
  };
  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateActiveStep);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  updateActiveStep();
}

function connectPortionPreview() {
  const slider = document.getElementById('portion-range');
  const weight = document.getElementById('portion-weight');
  if (!(slider instanceof HTMLInputElement) || !weight) return;

  const presetsPer100g = {
    doro: { protein: 10, carbs: 20.4761904762, fat: 7.380952381 },
    'doro-amharic': { protein: 10, carbs: 20.4761904762, fat: 7.380952381 },
    shiro: { protein: 7.6, carbs: 14.3, fat: 5.4 },
  };
  const dishButtons = [...document.querySelectorAll('[data-dish]')];
  let selectedDish = dishButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.dish
    || 'doro';

  const fields = new Map(
    ['calories', 'protein', 'carbs', 'fat'].map((key) => [
      key,
      document.querySelector(`[data-nutrition="${key}"]`),
    ]),
  );

  const update = () => {
    const grams = Number.parseInt(slider.value, 10);
    const preset = presetsPer100g[selectedDish] ?? presetsPer100g.doro;
    const macros = {
      protein: Math.round((preset.protein * grams) / 100),
      carbs: Math.round((preset.carbs * grams) / 100),
      fat: Math.round((preset.fat * grams) / 100),
    };
    const calories = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
    weight.value = `${grams} g`;
    weight.textContent = `${grams} g`;

    for (const [key, field] of fields) {
      if (field) field.textContent = String(key === 'calories' ? calories : macros[key]);
    }

    slider.setAttribute(
      'aria-valuetext',
      `${grams} grams; ${calories} calories in the sample plate`,
    );
  };

  dishButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedDish = button.dataset.dish;
      dishButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      update();
    });
  });

  slider.addEventListener('input', update);
  update();
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

setInitialReleaseLink();
positionDockIndicator();
observeDock();
observeTour();
connectPortionPreview();
loadMetadata().then(render);
