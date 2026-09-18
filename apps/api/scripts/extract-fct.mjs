/**
 * extract-fct.mjs — deterministic extractor for the Ethiopian FCT 2025
 * "User Guide and Condensed Table" PDF (EPHI & FAO 2025, FAO handle
 * 20.500.14283/cd9308en). Produces prisma/fixtures/fct-2025-extract.jsonl
 * (all 722 published rows) and, optionally, the 18-row fixture subset.
 *
 * Method: pdfjs-dist text items WITH their x/y positions. Each page of the
 * condensed table carries ONE of five sub-tables ((1/5) macros … (5/5) fatty
 * acids). Rows are reconstructed around their 6-digit food-code anchors and
 * every value is assigned to a COLUMN, never to a running counter:
 *
 *   1. Column anchors come from the page's own "INFOODS Tagnames" line
 *      (median x per tag position across every page of that sub-table), so a
 *      page with a corrupted tagname line still gets correct columns.
 *   2. Column boundaries are the midpoints between adjacent tag anchors, then
 *      widened by the observed spread of that page's own value tokens.
 *   3. A value token is written to the tag whose x-span contains it. A cell
 *      that is blank in the publication therefore stays absent — it can never
 *      be filled by the next nutrient's number (QA F-01).
 *   4. Per row, assigned columns must be strictly increasing left-to-right;
 *      any violation is reported loudly instead of being emitted silently.
 *
 * Energy (sub-table 1/5) is published as one compound "kJ(kcal)" cell, parsed
 * into energyKj + kcal; a bare kJ cell yields energyKj only. `tr` (trace,
 * below the limit of quantification) is kept verbatim. Bracketed "[1.8]"
 * values (estimated/imputed in the source) are transcribed without brackets.
 * Nutrition values are copied verbatim from the document — never derived.
 *
 * Usage: node scripts/extract-fct.mjs <path-to-pdf> [out.jsonl] [subset.jsonl]
 *   out.jsonl    default: prisma/fixtures/fct-2025-extract.jsonl
 *   subset.jsonl default: prisma/fixtures/fct-2025-fixture-subset.jsonl
 *                        (pass "none" to skip writing the fixture subset)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// pdfjs-dist legacy build (pure JS, Node-compatible).
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

// ── Table metadata ─────────────────────────────────────────────────────────
const GROUP_NAMES = {
  '01': 'Cereals and their products',
  '02': 'Starchy roots, tubers, and their products',
  '03': 'Legumes and their products',
  '04': 'Vegetables and their products',
  '05': 'Fruits and their products',
  '06': 'Nuts, seeds, and their products',
  '07': 'Meat, poultry, and their products',
  '08': 'Eggs and their products',
  '09': 'Fish, seafood, and their products',
  10: 'Milk and its products',
  11: 'Fats and oils',
  12: 'Beverages',
  13: 'Sugar and sweetened products',
  14: 'Condiments and spices',
  15: 'Miscellaneous',
  16: 'Soups and sauces',
  17: 'Mixed',
};

// Sub-table → tagnames in visual (left-to-right) order.
const SUBTABLES = {
  1: ['EDIBLE', 'ENERC', 'WATER', 'PROTCNT', 'FAT', 'CHOAVLDF', 'FIBTG', 'ASH'],
  2: ['CA', 'FE', 'MG', 'P', 'K', 'NA', 'ZN', 'CU', 'MN', 'SE'],
  3: ['THIA', 'RIBF', 'NIAEQ', 'NIA', 'VITB6C', 'FOL', 'VITB12', 'VITC'],
  4: ['CARTBEQ', 'RETOL', 'VITA', 'VITA_RAE', 'VITD', 'VITE', 'TOCPHA'],
  5: ['PHYTCPP', 'CHOLE', 'FASAT', 'FAMS', 'FAPU', 'F18D2CN6', 'F18D3CN3'],
};

// Output keys for sub-table columns (per100g fields in the JSONL).
const COLUMN_OUT = {
  1: {
    EDIBLE: 'ediblePortion',
    ENERC: 'energy', // special: "kJ(kcal)" compound cell
    WATER: 'waterG',
    PROTCNT: 'proteinG',
    FAT: 'fatG',
    CHOAVLDF: 'carbsG', // CHO available (documented in fixtures/README.md)
    FIBTG: 'fiberG',
    ASH: 'ashG',
  },
  2: {
    CA: 'calciumMg',
    FE: 'ironMg',
    MG: 'magnesiumMg',
    P: 'phosphorusMg',
    K: 'potassiumMg',
    NA: 'sodiumMg',
    ZN: 'zincMg',
    CU: 'copperMg',
    MN: 'manganeseMg',
    SE: 'seleniumUg',
  },
  3: {
    THIA: 'thiaminMg',
    RIBF: 'riboflavinMg',
    NIAEQ: 'niacinEquivMg',
    NIA: 'niacinMg',
    VITB6C: 'vitaminB6Mg',
    FOL: 'folateUg',
    VITB12: 'vitaminB12Ug',
    VITC: 'vitaminCMg',
  },
  4: {
    CARTBEQ: 'betaCaroteneUg',
    RETOL: 'retinolUg',
    VITA: 'vitaminAREUg',
    VITA_RAE: 'vitaminARAEUg',
    VITD: 'vitaminDUg',
    VITE: 'vitaminEMg',
    TOCPHA: 'alphaTocopherolMg',
  },
  5: {
    PHYTCPP: 'phytateMg',
    CHOLE: 'cholesterolMg',
    FASAT: 'saturatedFatG',
    FAMS: 'monounsaturatedFatG',
    FAPU: 'polyunsaturatedFatG',
    F18D2CN6: 'linoleicAcidG',
    F18D3CN3: 'alphaLinolenicAcidG',
  },
};

/**
 * S0 seed slug → FCT 2025 code, for the 18-row fixture subset (the mapping
 * documented in prisma/fixtures/README.md; avocado/banana are excluded because
 * the condensed table prints their energy in kJ only).
 */
const SEED_CODE_BY_SLUG = {
  injera: '010109',
  bread: '010133',
  pasta: '010163',
  rice: '010167',
  chechebsa: '010191',
  fuul: '030048',
  shiro_wot: '030088',
  misir_wot: '030093',
  kik_alicha: '030094',
  gomen: '040050',
  atkilt: '040085',
  orange: '050012',
  doro_wot: '070152',
  kitfo: '070153',
  beef_tibs: '070156',
  egg: '080001',
  milk: '100008',
  buna: '120007',
};
/** Fixture-subset key order (existing committed shape). */
const SUBSET_ROW_KEYS = ['seedSlug', 'sourceFoodCode', 'nameEn', 'nameAm', 'groupCode', 'groupName', 'page'];

const Y_TOLERANCE = 3; // PDF units for line grouping
const BAND = 16; // max y-distance from a row anchor for token capture
const TAG_CLUSTER_TOLERANCE = 14; // x-distance that merges tagname words of one column
const MAX_COLUMN_PAD = 40; // sanity bound when widening a column span from data
const MIN_CODE_X = 100; // left-edge markers ("Non-African data", group headers) live left of this
const TAG_TOLERANCE_STEPS = 3; // if a tag cluster splits into ≤ this many tokens, merge them

/**
 * The PDF font renders some ligatures as unmapped glyphs ("ComposiƟon",
 * "WaƩ"). Expand them so text matching and names are readable.
 */
function normalizeText(s) {
  return s
    .replace(/\u019F/g, 'ti') // Ɵ (ti ligature)
    .replace(/\u01A9/g, 'tt') // Ʃ (tt ligature)
    .replace(/\uFB01/g, 'fi') // ﬁ
    .replace(/\uFB02/g, 'fl') // ﬂ
    .replace(/\uFB00/g, 'ff') // ﬀ
    .replace(/\uFB03/g, 'ffi') // ﬃ
    .replace(/\uFB04/g, 'ffl') // ﬄ
    .replace(/\u00A0/g, ' ') // nbsp
    .replace(/\u2212/g, '-'); // minus sign
}

/** Group page text items into lines [{y, tokens:[{x,text,width}]}]. */
function buildLines(items) {
  const lines = [];
  for (const item of items) {
    if (item.str == null || !item.str.trim()) continue;
    const text = normalizeText(item.str.trim());
    if (!text) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const width = typeof item.width === 'number' ? item.width : 0;
    let line = lines.find((l) => Math.abs(l.y - y) <= Y_TOLERANCE);
    if (!line) {
      line = { y, tokens: [] };
      lines.push(line);
    }
    line.tokens.push({ x, text, width });
  }
  for (const line of lines) {
    line.tokens.sort((a, b) => a.x - b.x);
  }
  lines.sort((a, b) => b.y - a.y); // top of page first
  return lines;
}

const CODE_RE = /^\d{6}$/;
const META_MARKERS = /^(Non-African data|SD or Min-Max|SD or|SD|Min-Max|n|oa)$/;
const HEADER_FRAGMENT_RE =
  /^(portion|\(g\)|\(kJ|\(kcal\)|\(mcg\)|\(mg\)|available|total|dietary)/;

/** A value cell token: plain number, bracketed (imputed) number, below-limit
 * marker, the ENERC "kJ(kcal)" pair, or a stray closing paren of a split pair.
 * Bracketed values ("[1.8]") mark estimated/imputed cells in the source
 * table — recorded without brackets. */
const isCellToken = (t) =>
  /^-?[\d.,]+$/.test(t) ||
  /^\[-?[\d.,]+\]$/.test(t) ||
  /^<\s*-?[\d.,]+$/.test(t) ||
  /^≤\s*-?[\d.,]+$/.test(t) ||
  /^\d+\(\d+(\.\d+)?\)?$/.test(t) ||
  /^\[\d+\(\d+(\.\d+)?\)?\]$/.test(t) ||
  /^\)$/.test(t) ||
  /^tr$/i.test(t);

/** Parse a numeric cell token into a number, the verbatim marker string
 * ("<0.1" below-limit forms, "tr" trace), or null. */
function parseCell(text) {
  const cleaned = text.replace(/\s/g, '').replace(/,/g, '').replace(/[\[\]]/g, '');
  if (/^tr$/i.test(cleaned)) return 'tr'; // trace — below quantifiable limit, kept verbatim
  if (/^<\d/.test(cleaned) || /^≤\d/.test(cleaned)) return cleaned; // below-limit, kept verbatim
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse the ENERC compound cell.
 * - "1510(357)" / "[1510(357)]" → {energyKj, kcal}
 * - "644" / "[644]" (bare kJ — no kcal printed in the source) → {energyKj, kcal: absent}
 * - anything else (blank, malformed print) → {raw} verbatim, for documentation.
 */
function parseEnergy(text) {
  const cleaned = text.replace(/\s/g, '').replace(/[\[\]]/g, '');
  const pair = /^(\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\)?$/.exec(cleaned);
  if (pair) {
    return { energyKj: Number(pair[1]), kcal: Number(pair[2]) };
  }
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return { energyKj: Number(cleaned), kcal: undefined };
  }
  return { raw: text.trim() || null };
}

// ── Column calibration ─────────────────────────────────────────────────────
/**
 * Merge nearby x positions into clusters. Tagname cells like "VITA_RAE" or
 * "F18D2CN6" arrive as several word fragments; data cells like "852(202)"
 * arrive as one item, so clustering is used only for the tagname line.
 */
function clusterXs(xs, tolerance) {
  const sorted = [...xs].sort((a, b) => a - b);
  const clusters = [];
  for (const x of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && x - last[last.length - 1] <= tolerance) last.push(x);
    else clusters.push([x]);
  }
  return clusters;
}

/**
 * Extract the ordered tag anchors from one page's INFOODS tagname line.
 * Returns the per-column x positions (cluster means) or null when the line is
 * missing.
 */
function tagAnchorsFromLine(line) {
  const toks = line.tokens.filter((t) => t.x > MIN_CODE_X);
  if (toks.length === 0) return [];
  const clusters = clusterXs(
    toks.map((t) => t.x),
    TAG_CLUSTER_TOLERANCE,
  );
  return clusters.map((c) => c.reduce((a, b) => a + b, 0) / c.length);
}

/**
 * Collapse a tag-anchor list to exactly `columnCount` positions. A page whose
 * tagname line is corrupted (a tag printed twice or split in two) would yield
 * the wrong count; merging the closest pair of anchors is the least-damaging
 * repair and the deviation is reported by the caller.
 */
function coerceAnchorCount(anchors, columnCount) {
  const out = [...anchors];
  while (out.length > columnCount) {
    let bestI = 0;
    let bestGap = Infinity;
    for (let i = 1; i < out.length; i++) {
      const gap = out[i] - out[i - 1];
      if (gap < bestGap) {
        bestGap = gap;
        bestI = i;
      }
    }
    out.splice(bestI - 1, 2, (out[bestI - 1] + out[bestI]) / 2);
  }
  return out;
}

/**
 * The condensed table was typeset as (at least) two horizontal layout variants:
 * most pages place the code column at x ≈ 72, some at x ≈ 66.6. Absolute x
 * positions therefore cannot be shared between pages — column anchors are
 * calibrated PER PAGE from that page's own INFOODS tagname line, and the
 * observed variants are recorded so a page with a malformed tagname line can
 * still be assigned the variant whose left edge matches it.
 */
const LAYOUT_VARIANT_TOLERANCE = 4; // x-distance that separates layout variants

function clusterLayouts(samples) {
  const variants = []; // { leftEdges: number[], anchors: number[][] }
  for (const anchors of samples) {
    const left = anchors[0];
    const variant = variants.find((v) => Math.abs(v.leftEdges[0] - left) <= LAYOUT_VARIANT_TOLERANCE);
    if (variant) {
      variant.leftEdges.push(left);
      variant.anchors.push(anchors);
    } else {
      variants.push({ leftEdges: [left], anchors: [anchors] });
    }
  }
  return variants
    .map((v) => ({
      leftEdge: median(v.leftEdges),
      anchors: Array.from({ length: v.anchors[0].length }, (_, i) =>
        median(v.anchors.map((a) => a[i])),
      ),
      pages: v.leftEdges.length,
    }))
    .sort((a, b) => b.pages - a.pages);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Page parsing ───────────────────────────────────────────────────────────
function parsePage(lines, warnings) {
  let subTable = null;
  let columns = null;
  let amSplit = null; // x where the Amharic name column begins (sub-table 1 only)
  let tagAnchors = null; // per-page tagname x positions

  const tokens = []; // {x, y, text}
  const anchors = []; // {y, code}

  for (const line of lines) {
    if (line.y < 60) continue; // footer (page number)
    const joined = line.tokens.map((t) => t.text).join(' ').trim();
    if (!joined) continue;

    const m = /^Condensed Food Composition Table \((\d)\/5/.exec(joined);
    if (m) {
      subTable = Number(m[1]);
      columns = SUBTABLES[subTable];
      continue;
    }

    // (1/5) header carries the Amharic column start.
    if (/^Code Food name/.test(joined)) {
      const amTok = line.tokens.find((t) => t.text.includes('Food name in Amharic'));
      if (amTok) amSplit = amTok.x;
      continue;
    }

    // One page prints the tagname line as "I NFOODS Tagnames …" (a stray space
    // inside the label), so the match tolerates whitespace there.
    if (/^I\s?NFOODS\s+Tagnames\b/.test(joined)) {
      tagAnchors = tagAnchorsFromLine(line);
      continue;
    }

    // Classify the line by its left-edge (x < 100) markers.
    const leftTokens = line.tokens.filter((t) => t.x < MIN_CODE_X);
    const leftText = leftTokens.map((t) => t.text).join(' ').trim();

    if (leftText === '') {
      // No left-edge marker: header fragment or a bare name-continuation line.
      if (HEADER_FRAGMENT_RE.test(joined)) continue;
      for (const t of line.tokens) {
        tokens.push({ x: t.x, y: line.y, text: t.text });
      }
      continue;
    }

    if (leftText.startsWith('Code') || /^I ?NFOODS/.test(leftText)) continue;

    const isMeta =
      leftTokens.some((t) => META_MARKERS.test(t.text.trim())) ||
      Object.values(GROUP_NAMES).includes(leftText.replace(/\*$/, '').trim());
    if (isMeta) continue; // "Non-African data", "SD", "n", group headers — never captured

    // The food code is always the leftmost token of a row (x ≈ 72), so only the
    // first left-edge token is a code candidate — a numeric value cell can
    // never be mistaken for a row anchor.
    const firstLeft = leftTokens[0]?.text.trim() ?? '';
    const codeMatch = CODE_RE.test(firstLeft) ? firstLeft : null;
    if (codeMatch) {
      anchors.push({ y: line.y, code: codeMatch });
      for (const t of line.tokens) {
        if (t.x < MIN_CODE_X) continue; // the code anchor itself
        tokens.push({ x: t.x, y: line.y, text: t.text });
      }
      continue;
    }

    warnings.push(`unclassified line (page parsed but skipped): "${joined.slice(0, 80)}"`);
  }

  if (!columns) return { subTable, rows: new Map(), tagAnchors: null };

  const rows = new Map(); // code → {nameEn: [], nameAm: [], cells: Map}
  for (const a of anchors) {
    rows.set(a.code, { nameEn: [], nameAm: [], cells: new Map() });
  }

  return { subTable, rows, tagAnchors, anchors, tokens, amSplit };
}

// ── Main ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const pdfPath = args[0];
const outPath =
  args[1] ?? path.resolve(import.meta.dirname, '../prisma/fixtures/fct-2025-extract.jsonl');
const subsetPath =
  args[2] === 'none'
    ? null
    : (args[2] ?? path.resolve(import.meta.dirname, '../prisma/fixtures/fct-2025-fixture-subset.jsonl'));

if (!pdfPath || !fs.existsSync(pdfPath)) {
  console.error('usage: node scripts/extract-fct.mjs <path-to-fct-2025.pdf> [out.jsonl] [subset.jsonl|none]');
  process.exit(2);
}

const doc = await pdfjs
  .getDocument({
    data: new Uint8Array(fs.readFileSync(pdfPath)),
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  })
  .promise;

const warnings = [];
const bySub = { 1: [], 2: [], 3: [], 4: [], 5: [] }; // distinct codes seen per sub-table
const seenBySub = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const tagAnchorSamples = { 1: [], 2: [], 3: [], 4: [], 5: [] };
const pagesBySub = { 1: [], 2: [], 3: [], 4: [], 5: [] };
let tablePages = 0;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  const lines = buildLines(content.items);
  const pageHasHeader = lines.some((l) =>
    /^Condensed Food Composition Table \(\d\/5/.test(
      l.tokens.map((t) => t.text).join(' ').trim(),
    ),
  );
  if (!pageHasHeader) continue;
  tablePages++;

  // Printed page number: the footer token near the bottom of the page.
  let printedPage = null;
  for (const line of lines) {
    if (line.y > 60) continue;
    for (const t of line.tokens) {
      const m = /^(\d{1,3})$/.exec(t.text.trim());
      if (m) {
        printedPage = Number(m[1]);
        break;
      }
    }
    if (printedPage != null) break;
  }

  const parsed = parsePage(lines, warnings);
  const { subTable, tagAnchors } = parsed;
  if (subTable == null) continue;

  const expectedCount = SUBTABLES[subTable].length;
  if (tagAnchors && tagAnchors.length > 0) {
    const coerced = coerceAnchorCount(tagAnchors, expectedCount);
    if (coerced.length !== expectedCount) {
      warnings.push(
        `page ${p} (${subTable}/5): INFOODS tagname line has ${tagAnchors.length} x-cluster(s), expected ` +
          `${expectedCount} — page not used for column calibration`,
      );
    } else {
      tagAnchorSamples[subTable].push(coerced);
    }
  }

  pagesBySub[subTable].push({ page: p, printedPage, parsed });
  for (const code of parsed.rows.keys()) {
    if (!seenBySub[subTable].has(code)) {
      seenBySub[subTable].add(code);
      bySub[subTable].push({ page: p, printedPage, code, raw: parsed });
    }
  }
}

// Column anchors per sub-table layout variant: the median x of each tag position
// across every page that printed a well-formed INFOODS tagname line. Absolute x
// cannot be shared across pages because the PDF uses more than one horizontal
// layout variant; the variants are clustered by their left edge.
const tagAnchorsUsed = {};
const layoutVariants = {};
for (const st of [1, 2, 3, 4, 5]) {
  const samples = tagAnchorSamples[st];
  if (samples.length === 0) {
    console.error(`FATAL sub-table ${st}/5: no page with a well-formed INFOODS tagname line`);
    process.exit(3);
  }
  layoutVariants[st] = clusterLayouts(samples);
  tagAnchorsUsed[st] = layoutVariants[st][0].anchors.length;
}

// ── Assign value tokens to (row, column) ───────────────────────────────────
// Each page is walked with ITS OWN column anchors (from its own INFOODS line,
// or the layout variant whose left edge matches the page when that line is
// malformed). A value token belongs to the row anchor nearest in y and to the
// column whose x-span contains its left edge. Spans are the midpoints between
// adjacent tag anchors, so a blank cell can never be filled by its neighbour.
const perRowColumn = new Map(); // code → Map<subTable, Map<tag, raw text>>
const nameByCode = new Map(); // code → {nameEn: [], nameAm: []} (sub-table 1/5 only)
const occupancyViolations = [];
const unassignedTokens = [];
let variantFallbacks = 0;

/** Column index whose x-span contains `x` (spans = midpoints between anchors). */
function columnIndexFor(centers, x) {
  for (let i = 0; i < centers.length; i++) {
    const midPrev = i === 0 ? -Infinity : (centers[i - 1] + centers[i]) / 2;
    const midNext = i === centers.length - 1 ? Infinity : (centers[i] + centers[i + 1]) / 2;
    if (x >= midPrev && x < midNext) return i;
  }
  return -1;
}

/** Left edge of the nutrient area = half a column pitch left of the first anchor. */
function numericLeftBound(centers) {
  return centers.length > 1
    ? centers[0] - (centers[1] - centers[0]) / 2
    : centers[0] - MAX_COLUMN_PAD;
}

for (const st of [1, 2, 3, 4, 5]) {
  const tags = SUBTABLES[st];
  const expectedCount = tags.length;

  for (const { page: pageNo, parsed } of pagesBySub[st]) {
    const { anchors, tokens, amSplit } = parsed;
    if (!anchors || anchors.length === 0 || tokens.length === 0) continue;

    // Per-page column anchors: the page's own tagname line when well formed,
    // otherwise the layout variant matching this page's left-most x.
    let centers = null;
    const ownAnchors = coerceAnchorCount(parsed.tagAnchors ?? [], expectedCount);
    if (parsed.tagAnchors && ownAnchors.length === expectedCount) {
      centers = ownAnchors;
    } else {
      const pageLeft = Math.min(...tokens.map((t) => t.x));
      const variant =
        layoutVariants[st].find((v) => Math.abs(v.leftEdge - pageLeft) <= LAYOUT_VARIANT_TOLERANCE) ??
        layoutVariants[st][0];
      centers = variant.anchors.map((c) => c + (pageLeft - variant.leftEdge));
      variantFallbacks++;
      warnings.push(
        `page ${pageNo} (${st}/5): malformed INFOODS tagname line — using layout variant ` +
          `${variant.leftEdge.toFixed(1)} (${variant.pages} pages)`,
      );
    }
    const leftBound = numericLeftBound(centers);

    // Bucket this page's tokens by the row anchor they belong to (nearest y).
    // Keyed by the anchor object, never by the food code: a page can print the
    // same code twice (a row repeated below a page-break), and bucketing by code
    // would silently concatenate both printings' values.
    const byAnchor = new Map();
    for (const t of tokens) {
      let best = null;
      let bestDist = Infinity;
      for (const a of anchors) {
        const d = Math.abs(t.y - a.y);
        if (d < bestDist) {
          bestDist = d;
          best = a;
        }
      }
      if (!best || bestDist > BAND) continue;
      if (t.x < MIN_CODE_X) continue; // left-edge markers already handled
      if (!byAnchor.has(best)) byAnchor.set(best, []);
      byAnchor.get(best).push(t);
    }

    for (const [anchor, toks] of byAnchor) {
      const code = anchor.code;
      const rowMap = perRowColumn.get(code) ?? new Map();
      perRowColumn.set(code, rowMap);
      const cells = new Map();
      const nameEn = [];
      const nameAm = [];

      for (const t of toks) {
        if (t.x < leftBound) {
          // Name area: EN before amSplit, AM after (sub-table 1 only).
          if (st === 1 && amSplit != null && t.x >= amSplit) nameAm.push(t.text);
          else nameEn.push(t.text);
          continue;
        }
        if (!isCellToken(t.text)) continue; // non-numeric tokens in the nutrient area ("oa") are dropped
        const idx = columnIndexFor(centers, t.x);
        if (idx < 0) {
          unassignedTokens.push(`page ${pageNo} ${code}: "${t.text}" @x=${t.x.toFixed(1)}`);
          continue;
        }
        const tag = tags[idx];
        if (!cells.has(tag)) cells.set(tag, []);
        cells.get(tag).push({ x: t.x, text: t.text });
      }

      // Structural invariants of the published table: at most one value per
      // column per row, assigned strictly left-to-right. A violation means a
      // value landed in the wrong column — report it, never emit it silently.
      const order = [...cells.entries()].sort((a, b) => tags.indexOf(a[0]) - tags.indexOf(b[0]));
      let lastIdx = -1;
      for (const [tag, parts] of order) {
        const idx = tags.indexOf(tag);
        if (idx <= lastIdx) {
          occupancyViolations.push(
            `page ${pageNo} ${code}: column ${tag} appears out of order (sub-table ${st}/5)`,
          );
        }
        lastIdx = idx;
        if (parts.length > 1) {
          occupancyViolations.push(
            `page ${pageNo} ${code}: column ${tag} (${st}/5) received ${parts.length} tokens ` +
              `(${parts.map((p) => p.text).join(' ')}) — possible split cell`,
          );
        }
      }

      // A food repeated at the bottom of one page and the top of the next is
      // normal pagination; only emit the entry whose values are complete. If the
      // two printings disagree on a shared column that is a real anomaly.
      const prior = rowMap.get(st);
      if (prior) {
        for (const [tag, parts] of cells) {
          const prev = prior.get(tag);
          if (!prev) {
            prior.set(tag, parts); // fill in a cell the first printing omitted
            continue;
          }
          const prevText = prev.map((p) => p.text).join('');
          const nextText = parts.map((p) => p.text).join('');
          if (prevText !== nextText) {
            warnings.push(
              `page ${pageNo} ${code}: repeated row disagrees in column ${tag} (${st}/5): ` +
                `"${prevText}" vs "${nextText}"`,
            );
          }
        }
        continue;
      }
      rowMap.set(st, cells);
      const nameHolder = nameByCode.get(code) ?? { nameEn: [], nameAm: [] };
      if (st === 1) {
        nameHolder.nameEn.push(...nameEn);
        nameHolder.nameAm.push(...nameAm);
      }
      nameByCode.set(code, nameHolder);
    }

    // Sanity: how far do the page's own value tokens sit from their column
    // anchor? A token further than half a column pitch plus the bounded pad
    // means the calibration is suspicious — surface it, do not trust it.
    for (const t of tokens) {
      if (t.x < leftBound || !isCellToken(t.text)) continue;
      const idx = columnIndexFor(centers, t.x);
      if (idx < 0) continue;
      const halfPitch =
        (idx < centers.length - 1 ? centers[idx + 1] - centers[idx] : MAX_COLUMN_PAD) / 2;
      if (Math.abs(t.x - centers[idx]) > halfPitch + MAX_COLUMN_PAD) {
        warnings.push(
          `page ${pageNo}: token "${t.text}" @x=${t.x.toFixed(1)} is ` +
            `${Math.abs(t.x - centers[idx]).toFixed(1)} from the ${tags[idx]} anchor — verify column assignment`,
        );
      }
    }
  }
}

console.log(`parsed ${tablePages} condensed-table pages`);
for (const st of [1, 2, 3, 4, 5]) {
  console.log(
    `  sub-table ${st}/5 rows: ${bySub[st].length} | layout variants: ` +
      layoutVariants[st]
        .map((v) => `leftEdge ${v.leftEdge.toFixed(1)} (${v.pages} pages)`)
        .join(', '),
  );
}
if (variantFallbacks) {
  console.warn(`WARN ${variantFallbacks} page(s) used a layout-variant fallback (malformed tagname line)`);
}
if (occupancyViolations.length) {
  console.warn(`WARN ${occupancyViolations.length} column-occupancy violation(s):`);
  for (const v of occupancyViolations.slice(0, 40)) console.warn(`  ${v}`);
  if (occupancyViolations.length > 40) console.warn(`  … ${occupancyViolations.length - 40} more`);
}
if (unassignedTokens.length) {
  console.warn(`WARN ${unassignedTokens.length} value token(s) fell outside every column span:`);
  for (const v of unassignedTokens.slice(0, 40)) console.warn(`  ${v}`);
}

// ── Merge sub-tables by code (sub-table 1 is authoritative for names) ──────
const printedPageByCode = new Map();
for (const { printedPage, parsed } of pagesBySub[1]) {
  for (const code of parsed.rows.keys()) {
    if (!printedPageByCode.has(code)) printedPageByCode.set(code, printedPage);
  }
}
const merged = new Map();
for (const [code, names] of [...nameByCode.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  merged.set(code, {
    sourceFoodCode: code,
    nameEn: names.nameEn.join(' ').replace(/\s+/g, ' ').trim(),
    nameAm: names.nameAm.length ? names.nameAm.join(' ').replace(/\s+/g, ' ').trim() : null,
    groupCode: code.slice(0, 2),
    groupName: GROUP_NAMES[code.slice(0, 2)] ?? null,
    page: printedPageByCode.get(code) ?? null,
    per100g: {},
  });
}

const allCodes = new Set();
for (const st of [1, 2, 3, 4, 5]) {
  for (const { parsed } of pagesBySub[st]) for (const code of parsed.rows.keys()) allCodes.add(code);
}
const missingFrom1 = [...allCodes].filter((c) => !merged.has(c));
if (missingFrom1.length) {
  warnings.push(`codes present in sub-tables but missing from 1/5 (dropped): ${missingFrom1.sort().join(', ')}`);
}
const withoutNames = [...merged.values()].filter((r) => !r.nameEn);
if (withoutNames.length) {
  warnings.push(`rows without a nameEn: ${withoutNames.map((r) => r.sourceFoodCode).join(', ')}`);
}

for (const code of [...merged.keys()].sort()) {
  const rec = merged.get(code);
  const rowMap = perRowColumn.get(code);
  if (!rowMap) continue;
  for (const st of [1, 2, 3, 4, 5]) {
    const cells = rowMap.get(st);
    if (!cells) continue;
    const tags = SUBTABLES[st];
    const ordered = [...cells.entries()].sort((a, b) => tags.indexOf(a[0]) - tags.indexOf(b[0]));
    for (const [tag, parts] of ordered) {
      const key = COLUMN_OUT[st][tag];
      if (!key) continue;
      const raw = parts.map((p) => p.text).join('');
      if (st === 1 && tag === 'ENERC') {
        const energy = parseEnergy(raw);
        if (energy.energyKj != null) rec.per100g.energyKj = energy.energyKj;
        if (energy.kcal != null) rec.per100g.kcal = energy.kcal;
        if (energy.raw) rec.per100g.energyRaw = energy.raw; // blank/malformed cell, verbatim
      } else {
        rec.per100g[key] = parseCell(raw);
      }
    }
  }
}

// Deterministic output: fixed key order, sorted by code.
const outRows = [...merged.values()].sort((a, b) => a.sourceFoodCode.localeCompare(b.sourceFoodCode));
const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
fs.writeFileSync(outPath, jsonl(outRows), 'utf8');

// ── Fixture subset (18 S0 foods), same keys/order as the committed file ────
if (subsetPath) {
  const byCode = new Map(outRows.map((r) => [r.sourceFoodCode, r]));
  const subsetRows = [];
  for (const [slug, code] of Object.entries(SEED_CODE_BY_SLUG)) {
    const row = byCode.get(code);
    if (!row) {
      console.error(`FATAL fixture subset: code ${code} (seed ${slug}) not found in the extract`);
      process.exit(4);
    }
    const out = {};
    for (const key of SUBSET_ROW_KEYS) out[key] = row[key];
    out.seedSlug = slug;
    out.per100g = row.per100g;
    subsetRows.push(out);
  }
  subsetRows.sort((a, b) => a.sourceFoodCode.localeCompare(b.sourceFoodCode));
  fs.writeFileSync(subsetPath, jsonl(subsetRows), 'utf8');
  console.log(`wrote ${subsetRows.length} fixture-subset rows → ${subsetPath}`);
  console.log(
    `fixture-subset codes: ${subsetRows.map((r) => r.sourceFoodCode).join(', ')}`,
  );
}

const pdfSha = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex').toUpperCase();

console.log(`wrote ${outRows.length} rows → ${outPath}`);
console.log(`source pdf sha256: ${pdfSha}`);
if (warnings.length) {
  console.warn(`total warnings: ${warnings.length}`);
  for (const w of warnings.slice(0, 20)) console.warn(`  ${w}`);
}
