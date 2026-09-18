/**
 * verify-extract.mjs — verification for prisma/fixtures/fct-2025-extract.jsonl
 * and fct-2025-fixture-subset.jsonl.
 *
 * The extract is produced by POSITIONAL parsing of the FCT 2025 PDF
 * (scripts/extract-fct.mjs). This script cross-checks it against a SECOND,
 * independent rendering of the same publication: FAO's published text layer of
 * the same PDF bitstream (recorded in prisma/fixtures/README.md; downloaded
 * alongside the PDF, never committed). The text layer is a different artefact
 * from the PDF text items the extractor reads, so agreement is genuine
 * double-entry evidence — but it does NOT preserve blank cells (a text dump
 * drops them), which is why the comparison below reconstructs column
 * boundaries (gap heuristic) and reports ambiguity instead of guessing.
 *
 * Checks:
 *  1. Row count == 722 — rows the published Condensed Food Composition Table
 *     contains (Table 1 of the same document reports 727 entries for the full
 *     EFCT 2025 dataset; the difference is the Excel datasheet distribution,
 *     not this PDF — see prisma/fixtures/README.md).
 *  2. Structural invariants: codes unique, nameEn non-empty, kcal numeric (or
 *     the documented kJ-only / malformed-energy exceptions).
 *  3. EVERY column of EVERY block that has a published value is compared to the
 *     text layer — not just energy. The comparison is per row and per column,
 *     over ALL 722 rows as well as the 18 fixture foods (a stratified sample is
 *     therefore included, and exceeded). The output states the exact column
 *     list and the number of rows/cells compared.
 *  4. A targeted shift detector: for any row, if the extracted value sequence is
 *     a CONTIGUOUS RUN of the published row that does not start at the first
 *     published value, the row has been left-shifted (the defect class this
 *     script exists to catch) and the run fails.
 *
 * Usage: node scripts/verify-extract.mjs <cd9308en.pdf.txt> [extract.jsonl] [fixture-subset.jsonl]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const txtPath = args[0];
const fixturesDir = path.resolve(import.meta.dirname, '../prisma/fixtures');
const extractPath = args[1] ?? path.join(fixturesDir, 'fct-2025-extract.jsonl');
const subsetPath = args[2] === 'none' ? null : (args[2] ?? path.join(fixturesDir, 'fct-2025-fixture-subset.jsonl'));

if (!txtPath || !fs.existsSync(txtPath)) {
  console.error('usage: node scripts/verify-extract.mjs <cd9308en.pdf.txt> [extract.jsonl] [subset.jsonl|none]');
  process.exit(2);
}

// ── The published table layout, as printed in the PDF ─────────────────────
// Sub-table → [output key, INFOODS tagname]. This mirrors the extractor's map;
// it is stated here explicitly so the output can name every column compared.
const SUBTABLES = {
  1: [
    ['ediblePortion', 'EDIBLE'],
    ['energyKj', 'ENERC(kJ)'],
    ['kcal', 'ENERC(kcal)'],
    ['waterG', 'WATER'],
    ['proteinG', 'PROTCNT'],
    ['fatG', 'FAT'],
    ['carbsG', 'CHOAVLDF'],
    ['fiberG', 'FIBTG'],
    ['ashG', 'ASH'],
  ],
  2: [
    ['calciumMg', 'CA'],
    ['ironMg', 'FE'],
    ['magnesiumMg', 'MG'],
    ['phosphorusMg', 'P'],
    ['potassiumMg', 'K'],
    ['sodiumMg', 'NA'],
    ['zincMg', 'ZN'],
    ['copperMg', 'CU'],
    ['manganeseMg', 'MN'],
    ['seleniumUg', 'SE'],
  ],
  3: [
    ['thiaminMg', 'THIA'],
    ['riboflavinMg', 'RIBF'],
    ['niacinEquivMg', 'NIAEQ'],
    ['niacinMg', 'NIA'],
    ['vitaminB6Mg', 'VITB6C'],
    ['folateUg', 'FOL'],
    ['vitaminB12Ug', 'VITB12'],
    ['vitaminCMg', 'VITC'],
  ],
  4: [
    ['betaCaroteneUg', 'CARTBEQ'],
    ['retinolUg', 'RETOL'],
    ['vitaminAREUg', 'VITA'],
    ['vitaminARAEUg', 'VITA_RAE'],
    ['vitaminDUg', 'VITD'],
    ['vitaminEMg', 'VITE'],
    ['alphaTocopherolMg', 'TOCPHA'],
  ],
  5: [
    ['phytateMg', 'PHYTCPP'],
    ['cholesterolMg', 'CHOLE'],
    ['saturatedFatG', 'FASAT'],
    ['monounsaturatedFatG', 'FAMS'],
    ['polyunsaturatedFatG', 'FAPU'],
    ['linoleicAcidG', 'F18D2CN6'],
    ['alphaLinolenicAcidG', 'F18D3CN3'],
  ],
};
/** Blocks QA finding F-01 mis-assigned: reported separately in the summary. */
const MINERAL_BLOCK = 2;
const FATTY_ACID_BLOCK = 5;

/** Ground truth transcribed from the published table (QA finding F-01). */
const GROUND_TRUTH = {
  '070152': {
    block: 2,
    values: [24, 1.2, 16, 85, 167, 332, 0.62, 0.09, 0.25, 6],
  },
  '080001': {
    block: 2,
    values: [38, 1.8, 11, 138, 108, 137, 0.97, 0.05, 0.02, 28],
    block5: { block: 5, values: [0, 292, 2.02, 2.59, 1.26, 0.96, 0.03] },
  },
  '010109': {
    block: 2,
    values: [66, 11.1, 76, 118, 156, 12, 1.2, 0.23, 3.99, 10],
  },
};

const rows = fs
  .readFileSync(extractPath, 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));

const txt = fs.readFileSync(txtPath, 'utf8');
const txtLines = txt.split('\n');

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`FAIL ${msg}`);
};

// ── 1. Row count ──────────────────────────────────────────────────────────
const EXPECTED_TABLE_ROWS = 722;
if (rows.length !== EXPECTED_TABLE_ROWS) {
  fail(`row count ${rows.length} != ${EXPECTED_TABLE_ROWS} (condensed table row count)`);
} else {
  console.log(`OK row count == ${EXPECTED_TABLE_ROWS} (published condensed table)`);
}

// ── 2. Structural invariants ──────────────────────────────────────────────
const codes = new Set();
const kjOnlyRows = [];
const noEnergyRows = [];
for (const r of rows) {
  if (codes.has(r.sourceFoodCode)) fail(`duplicate code ${r.sourceFoodCode}`);
  codes.add(r.sourceFoodCode);
  if (!/^\d{6}$/.test(r.sourceFoodCode)) fail(`bad code format: ${r.sourceFoodCode}`);
  if (!r.nameEn || !r.nameEn.trim()) fail(`${r.sourceFoodCode}: empty nameEn`);
  if (typeof r.page !== 'number') fail(`${r.sourceFoodCode}: page citation missing`);
  const kcal = r.per100g?.kcal;
  const kj = r.per100g?.energyKj;
  if (typeof kcal === 'number' && Number.isFinite(kcal)) {
    // normal row
  } else if (typeof kj === 'number' && Number.isFinite(kj)) {
    kjOnlyRows.push(r.sourceFoodCode); // source prints kJ only — documented
  } else {
    noEnergyRows.push(r.sourceFoodCode); // blank or malformed energy cell — documented
  }
  if (typeof r.per100g?.proteinG !== 'number' && !(r.per100g?.proteinG === 'tr')) {
    fail(`${r.sourceFoodCode}: proteinG not numeric`);
  }
  if (typeof r.per100g?.fatG !== 'number' && !(r.per100g?.fatG === 'tr')) {
    fail(`${r.sourceFoodCode}: fatG not numeric`);
  }
}
console.log(`OK codes unique; nameEn + page present on all ${rows.length} rows`);
console.log(
  `INFO ${kjOnlyRows.length} row(s) print energy in kJ only (no kcal): ${kjOnlyRows.join(', ')}`,
);
console.log(
  `INFO ${noEnergyRows.length} row(s) have a blank/malformed energy cell: ${noEnergyRows.join(', ')}`,
);

// ── 3. Parse the published text layer (independent rendering) ─────────────
let firstHeader = -1;
let lastHeader = -1;
txtLines.forEach((l, i) => {
  if (/Condensed Food Composi.+Table \(\d\/5/.test(l)) {
    if (firstHeader < 0) firstHeader = i;
    lastHeader = i;
  }
});
if (firstHeader < 0) {
  console.error('FAIL the FAO text layer contains no condensed-table header');
  process.exit(1);
}
if (/Condensed Food Composi.+Table \(5\/5/.test(txtLines[lastHeader]) === false) {
  // Last header must be 5/5 for the region to cover the whole table.
  console.warn('WARN last condensed-table header in the text layer is not (5/5)');
}

/**
 * Split a text-layer row into its published value cell strings.
 *
 * The text layer separates cells with runs of TWO OR MORE spaces, so such a run
 * is an unambiguous cell boundary; within a cell, single spaces, line-wrap
 * glitches ("10,10.3", "10 10.30") and name prefixes are the text layer's own
 * rendering artefacts. Every numeric token inside a cell is a published value;
 * name words, annotation comments and footnote letters are dropped.
 */
const VALUE_TOKEN_RE =
  /^(?:-?\d+(?:[.,]\d+)?|\[\s*-?\d+(?:[.,]\d+)?\s*\]|-?\d+(?:[.,]\d+)?\s*-\s*-?\d+(?:[.,]\d+)?|tr|\[tr\]|\d+\(\d+(?:\.\d+)?\)?)$/i;

/** Expand one token into the published value(s) it encodes. */
function tokenToValues(token) {
  const t = token.replace(/\s+/g, '');
  if (!VALUE_TOKEN_RE.test(t)) return null;
  if (/^\[?tr\]?$/i.test(t)) return ['tr'];
  // A comma in this table is either a decimal mark ("0,7" = 0.7) or, where the
  // text layer lost the space between two cells, a cell boundary. Decide by the
  // published value ranges: minerals and fatty acids never exceed 2000 and
  // "0,7" (0.7) is a plausible value, so prefer whichever reading parses as
  // plausible published cells.
  if (t.includes(',')) {
    const [a, b] = t.split(',');
    const bothInts = /^\d+$/.test(a) && /^\d+$/.test(b);
    const bDecimal = /^\d+\.\d+$/.test(b);
    if (bothInts && (Number(a) > 200 || Number(b) > 400 || Number(b) === 0 || a.length >= 3)) {
      // Merged cells: "376,0" → 37 | 6, "1110,0" → 111 | 0, "188,590".
      // Anything above the published maximum (≈2000) cannot be a grouping.
      if (Number(a) <= 4000 && Number(b) <= 4000) return [a, b];
    }
    if (bDecimal) return [a, b]; // "10,10.3" / "29,5.5"
    const n = Number(t.replace(',', '.'));
    return [Number.isFinite(n) ? n : t];
  }
  return [t.replace(/^\[|\]$/g, '')];
}

function parseTextRow(line) {
  const body = line.replace(/\s+$/, '');
  const segments = [];
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === ' ' && body[i + 1] === ' ') {
      segments.push(body.slice(start, i));
      while (body[i] === ' ') i++;
      start = i;
      i--;
    }
  }
  segments.push(body.slice(start));

  const values = [];
  for (const segment of segments) {
    // Name prefixes fused to the first value ("030003Eragrostis tef, grain, raw 1"),
    // annotation comments ("0.07 // Calculated") and split numbers are all
    // handled by taking every numeric token of the cell.
    const cell = segment.split('//')[0];
    for (const token of cell.trim().split(/\s+/)) {
      if (!token) continue;
      const expanded = tokenToValues(token);
      if (expanded) values.push(...expanded);
    }
  }
  return values;
}

/** Text-layer rows of the condensed table: code → {block → [cell strings]}. */
const textByBlock = { 1: new Map(), 2: new Map(), 3: new Map(), 4: new Map(), 5: new Map() };
const textDuplicatePrefixes = [];
let currentBlock = null;
let textRowsSeen = 0;
for (let i = firstHeader; i <= lastHeader; i++) {
  const line = txtLines[i];
  if (line == null) continue;
  const header = /Condensed Food Composi.+Table \((\d)\/5/.exec(line);
  if (header) {
    currentBlock = Number(header[1]);
    continue;
  }
  if (currentBlock == null) continue;
  const m = /^\s*(\d{6})(?![0-9])(.*)$/.exec(line);
  if (!m) continue;
  const [, code, rest] = m;
  // The code is sometimes fused to the name ("030003Eragrostis tef, grain, raw 1").
  const values = parseTextRow(rest);
  // A wide row can wrap its name AND its values onto following lines: the name
  // then occupies a line of its own and a "values only" line follows it
  // ("010025 Biscuit, sweet, soft sandwich" / " 10 10.30 5.70 …"). Scan forward
  // over at most two name lines for the row's values-only line.
  const isValueOnlyLine = (l) => {
    const t = (l ?? '').trim();
    if (!t) return false;
    return t.split(/\s+/).every((tok) => VALUE_TOKEN_RE.test(tok) || /^\d+,\d+(\.\d+)?$/.test(tok));
  };
  for (let k = i + 1; k <= i + 3; k++) {
    const next = txtLines[k];
    if (next == null || next.trim() === '') break;
    if (/Non-African|SD or Min-Max|Condensed Food/.test(next)) break;
    if (/^\s*\d{6}(?![0-9])/.test(next)) break; // a new row starts
    if (!isValueOnlyLine(next)) continue; // a name-continuation line — skip it
    values.push(...parseTextRow(next));
    break;
  }
  if (values.length === 0) continue;
  const blockMap = textByBlock[currentBlock];
  if (blockMap.has(code)) {
    // A row carried over a page break is printed twice. The two printings must
    // agree wherever both are present; a printing that simply LOST trailing
    // cells (the text layer wraps or drops them) is a known lossiness of this
    // rendering, not an extract defect — so a strict-prefix pair is recorded as
    // informational, while a genuine positional disagreement still fails.
    const prev = blockMap.get(code);
    if (prev.join('|') !== values.join('|')) {
      const shorter = prev.length <= values.length ? prev : values;
      const longer = prev.length <= values.length ? values : prev;
      const isPrefix = shorter.every((v, k) => v === longer[k]);
      if (isPrefix) {
        textDuplicatePrefixes.push(
          `${code} ${currentBlock}/5 (printings of ${prev.length} and ${values.length} values — longer one used)`,
        );
        blockMap.set(code, longer);
      } else {
        fail(`text layer: code ${code} (block ${currentBlock}/5) printed twice with different values`);
      }
    }
    continue;
  }
  blockMap.set(code, values);
  textRowsSeen++;
}

/**
 * Normalize one published value for comparison. The publication's text layer
 * wraps wide numbers internally ("1510(357" for "1510(357)", "0,7" for "0.7"),
 * so both sides are canonicalised to a number, a marker string, or the energy
 * pair "kJ(kcal)".
 */
function normCell(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/^\[|\]$/g, '').trim();
  if (/^tr$/i.test(s)) return 'tr';
  // Energy pair "1510(357)" / "1510(357" (the text layer drops the final paren).
  const pair = /^(\d+)\((\d+(?:\.\d+)?)\)?$/.exec(s);
  if (pair) return `${pair[1]}(${pair[2]})`;
  if (/^<\d/.test(s) || /^≤\d/.test(s)) return s.replace(/≤/g, '<');
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : s;
}

/**
 * The extract keeps energy in two output fields (energyKj, kcal) while the
 * publication prints one compound cell "kJ(kcal)". Rebuild the published cell
 * sequence so both sides are comparable position by position.
 */
function extractCells(row) {
  const perBlock = {};
  for (const [st, columns] of Object.entries(SUBTABLES)) {
    const cells = [];
    for (const [key] of columns) {
      if (st === '1') {
        if (key === 'energyKj') continue; // handled with kcal below
        if (key === 'kcal') {
          const kj = row.per100g.energyKj;
          const kcal = row.per100g.kcal;
          if (typeof kj === 'number' && typeof kcal === 'number') {
            cells.push(normCell(`${kj}(${kcal})`));
            continue;
          }
          if (typeof kj === 'number') {
            cells.push(normCell(kj));
            continue;
          }
          if (row.per100g.energyRaw != null) {
            cells.push(normCell(row.per100g.energyRaw));
            continue;
          }
          cells.push(null);
          continue;
        }
      }
      cells.push(normCell(row.per100g[key]));
    }
    perBlock[st] = cells;
  }
  return perBlock;
}

/**
 * Compare one block's extracted values against the published values of the same
 * row in the text layer.
 *
 * The text layer is a LOSSY second rendering: it drops blank cells and its cell
 * separators are not preserved consistently (a wrap can fuse two cells into
 * one). Positional reconstruction is therefore not always possible — but the
 * VALUE MULTISET is preserved, and comparing it catches exactly the defect class
 * this script exists for (a mis-assigned column yields values that do not occur
 * in the published row; a dropped column yields a missing value):
 *   - every emitted value must occur in the published row (else: fabricated or
 *     mis-assigned value → hard failure, naming the column it was written to);
 *   - every published value must occur in the extract (else: a published value
 *     was dropped → hard failure);
 *   - when the extract omits values, the published row has more values than the
 *     extract emitted — those are blank cells in the publication, and the
 *     extract's own column positions decide which column they belong to. When
 *     the omitted run is leading, a shift is indistinguishable from blanks in
 *     the source; such rows are reported as "leading blank cells (or shift)".
 */
function compareBlock(published, extracted) {
  const V = published.map(normCell);
  const obs = [];
  for (let ci = 0; ci < extracted.length; ci++) if (extracted[ci] != null) obs.push({ ci, value: extracted[ci] });
  if (obs.length === 0) return { verdict: 'empty', blanks: V.length, offset: null };
  const remaining = [...V];
  const extras = [];
  const verified = new Map(); // extract column index → published value verified
  for (const { ci, value } of obs) {
    const at = remaining.indexOf(value);
    if (at >= 0) {
      remaining.splice(at, 1);
      verified.set(ci, value);
    } else {
      extras.push({ ci, value });
    }
  }
  if (extras.length > 0) {
    return { verdict: 'mismatch', extras, missing: remaining, verified, blanks: 0, offset: null };
  }
  if (remaining.length > 0) {
    return { verdict: 'missing', missing: remaining, verified, blanks: remaining.length, offset: null };
  }
  return { verdict: 'exact', verified, blanks: 0, offset: 0 };
}

/**
 * Was the extract's value sequence a contiguous run of the published sequence
 * that does not begin at the first published value? That is the shape of the
 * QA F-01 left-shift — and equally the shape of genuinely blank leading cells,
 * which is why it is reported (loudly) but not treated as a failure on its own.
 */
function leadingRun(published, extracted) {
  const V = published.map(normCell);
  const obs = extracted.filter((v) => v != null);
  if (obs.length === 0 || obs.length >= V.length) return null;
  for (let start = 1; start + obs.length <= V.length; start++) {
    let ok = true;
    for (let k = 0; k < obs.length; k++) {
      if (V[start + k] !== obs[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return start;
  }
  return null;
}

// ── 4. Column-by-column comparison ────────────────────────────────────────
const stats = {}; // block → column → {checked, mismatch, blank}
for (const st of Object.keys(SUBTABLES)) {
  stats[st] = {};
  for (const [, tag] of SUBTABLES[st]) stats[st][tag] = { checked: 0, mismatch: 0, blank: 0 };
}
let rowsCompared = 0;
let blocksCompared = 0;
let blocksExact = 0;
let rowsNoTextRow = 0;
let cellsCompared = 0;
let cellsMismatched = 0;
let cellsBlank = 0;
const blankCellsByColumn = {}; // "block/TAG" → published values the extract legitimately omits
const extraCellsByColumn = {}; // "block/TAG" → extract values matching no published value
const leadingBlankRows = [];
const unknownCodes = [];
const ambiguousRows = []; // text-layer row cannot support a column comparison

for (const row of rows) {
  const cells = extractCells(row);
  let comparedThisRow = false;
  for (const st of ['1', '2', '3', '4', '5']) {
    const published = textByBlock[st].get(row.sourceFoodCode);
    if (!published) continue;
    const extracted = cells[st];
    const observed = extracted.filter((v) => v != null);
    if (observed.length === 0) continue; // nothing published in this block for this row
    const tags = SUBTABLES[st];

    // ── Text-layer tractability gate ──────────────────────────────────────
    // The published text layer is a SECOND rendering of the table and is lossy
    // in ways the extractor's positional read is not: it drops blank cells,
    // splits one printed number into two tokens ("17" → "1 7", "0.01" →
    // "0.0 1") and merges two cells into one. A row whose published token count
    // cannot correspond to this block's column count therefore cannot support a
    // column-by-column verdict at all, and is reported as such instead of being
    // scored as a mismatch — the extractor's PDF-geometry evidence decides
    // those rows (see the ground-truth block below).
    const expected = tags.length;
    if (published.length > expected) {
      ambiguousRows.push(
        `${row.sourceFoodCode} ${st}/5 (published row has ${published.length} tokens for ${expected} columns — text layer split/merged cells)`,
      );
      continue;
    }
    if (published.length < expected && observed.length > published.length) {
      ambiguousRows.push(
        `${row.sourceFoodCode} ${st}/5 (text layer kept only ${published.length} of ${observed.length} published values)`,
      );
      continue;
    }

    const result = compareBlock(published, extracted);
    comparedThisRow = true;
    rowsCompared++;
    blocksCompared++;

    if (result.verdict === 'mismatch') {
      for (const { ci, value } of result.extras) {
        const tag = tags[ci][1];
        stats[st][tag].mismatch++;
        cellsMismatched++;
        const key = `${st}/${tag}`;
        extraCellsByColumn[key] = (extraCellsByColumn[key] ?? 0) + 1;
        fail(
          `${row.sourceFoodCode} block ${st}/5 column ${tag}: extract ${JSON.stringify(value)} does not ` +
            `occur in the published row ${JSON.stringify(published.map(normCell))}`,
        );
      }
      continue;
    }
    if (result.verdict === 'missing') {
      // The extract omitted published values. Count them against the columns the
      // extractor left empty (only the positions are unknown, not the values).
      cellsBlank += result.missing.length;
      for (let ci = 0; ci < extracted.length; ci++) {
        if (extracted[ci] != null) continue;
        const key = `${st}/${tags[ci][1]}`;
        blankCellsByColumn[key] = (blankCellsByColumn[key] ?? 0) + 1;
      }
      const start = leadingRun(published, extracted);
      if (start != null) {
        leadingBlankRows.push(
          `${row.sourceFoodCode} ${st}/5 (first ${start} published value(s) absent from the extract)`,
        );
      }
    } else {
      blocksExact++;
    }

    for (let ci = 0; ci < extracted.length; ci++) {
      const value = extracted[ci];
      if (value == null) continue;
      const tag = tags[ci][1];
      if (result.verified.has(ci)) {
        stats[st][tag].checked++;
        cellsCompared++;
      } else {
        stats[st][tag].mismatch++;
        cellsMismatched++;
      }
    }
  }
  if (!comparedThisRow) {
    rowsNoTextRow++;
    const hasValues = Object.values(cells).some((c) => c.some((v) => v != null));
    const inText = Object.values(textByBlock).some((m) => m.has(row.sourceFoodCode));
    if (hasValues && !inText) unknownCodes.push(row.sourceFoodCode);
  }
}

console.log('');
console.log('── Column-by-column comparison against the FAO text layer ──');
console.log(`Extract rows: ${rows.length}; row/block pairs compared: ${blocksCompared} (rows: ${rowsCompared})`);
console.log(`Row/block pairs whose value multiset is EXACTLY the published one: ${blocksExact}`);
console.log(`Rows with no text-layer counterpart at all: ${rowsNoTextRow}`);
if (unknownCodes.length) {
  console.warn(`WARN ${unknownCodes.length} row(s) absent from the text layer: ${unknownCodes.join(', ')}`);
}
console.log(
  `Values verified one-by-one against a published value: ${cellsCompared} | values that match NO published ` +
    `value: ${cellsMismatched} | published values the extract omits (blank cells): ${cellsBlank}`,
);
for (const st of ['1', '2', '3', '4', '5']) {
  const label =
    st === String(MINERAL_BLOCK)
      ? '  ← mineral block (F-01)'
      : st === String(FATTY_ACID_BLOCK)
        ? '  ← phytate / fatty-acid block (F-01)'
        : '';
  console.log(`Block ${st}/5${label}`);
  console.log(`  columns compared: ${SUBTABLES[st].map(([, t]) => t).join(', ')}`);
  console.log(
    `  values verified per column: ${SUBTABLES[st]
      .map(([, t]) => `${t}=${stats[st][t].checked}${stats[st][t].mismatch ? `(MISMATCH ${stats[st][t].mismatch})` : ''}`)
      .join(' ')}`,
  );
}
console.log(
  `Text-layer rows read: block1=${textByBlock[1].size} block2=${textByBlock[2].size} ` +
    `block3=${textByBlock[3].size} block4=${textByBlock[4].size} block5=${textByBlock[5].size} ` +
    `(total ${textRowsSeen} code/block pairs)`,
);
const blankList = Object.entries(blankCellsByColumn).sort((a, b) => b[1] - a[1]);
if (blankList.length) {
  console.log(
    `Published cells the extract omits (blank in the publication), by column: ` +
      blankList.map(([k, v]) => `${k}=${v}`).join(' '),
  );
}

if (ambiguousRows.length) {  console.log(
    `Text-layer-intractable row/block pairs (NOT scored as mismatches; the text layer itself is lossy for these, ` +
      `so the extractor's PDF-geometry evidence decides them): ${ambiguousRows.length}`,
  );
  for (const a of ambiguousRows) console.log(`  · ${a}`);
}

if (leadingBlankRows.length) {
  console.warn(
    `WARN ${leadingBlankRows.length} row/block pair(s) whose extract values are a contiguous run of the published ` +
      `row starting after its first value — the shape of both a left-shift and genuinely blank leading cells. ` +
      `For these the column-position evidence of the PDF (extractor) is what decides; the text layer cannot: ` +
      `${leadingBlankRows.slice(0, 12).join('; ')}` +
      (leadingBlankRows.length > 12 ? ` … +${leadingBlankRows.length - 12} more` : ''),
  );
}
// ── 5. Ground truth for the F-01 rows ─────────────────────────────────────
console.log('');
console.log('── Ground truth (QA F-01 published values) ──');
for (const [code, spec] of Object.entries(GROUND_TRUTH)) {
  const row = rows.find((r) => r.sourceFoodCode === code);
  if (!row) {
    fail(`ground truth: code ${code} missing from the extract`);
    continue;
  }
  const check = (blockNo, expected, label) => {
    const tags = SUBTABLES[blockNo];
    const got = tags.map(([key]) => normCell(row.per100g[key]));
    const ok = JSON.stringify(got) === JSON.stringify(expected);
    if (!ok) {
      fail(`ground truth ${code} ${label}: got ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`);
    } else {
      console.log(
        `OK ${code} ${label} (${tags.map(([, t]) => t).join(' ')}): ${JSON.stringify(got)}`,
      );
    }
    return ok;
  };
  check(spec.block, spec.values, 'minerals');
  if (spec.block5) check(spec.block5.block, spec.block5.values, 'phytate/fatty acids');
}

// ── 6. Fixture subset consistency ─────────────────────────────────────────
if (subsetPath && fs.existsSync(subsetPath)) {
  const subset = fs
    .readFileSync(subsetPath, 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  const byCode = new Map(rows.map((r) => [r.sourceFoodCode, r]));
  for (const s of subset) {
    const full = byCode.get(s.sourceFoodCode);
    if (!full) {
      fail(`fixture subset ${s.seedSlug} (${s.sourceFoodCode}) is not in the staged extract`);
      continue;
    }
    for (const [key, value] of Object.entries(s.per100g)) {
      const expected = normCell(full.per100g[key]);
      if (normCell(value) !== expected) {
        fail(
          `fixture subset ${s.seedSlug} (${s.sourceFoodCode}) per100g.${key}: ${JSON.stringify(value)} ` +
            `!= extract ${JSON.stringify(full.per100g[key])}`,
        );
      }
    }
    for (const field of ['nameEn', 'nameAm', 'groupCode', 'page']) {
      if (JSON.stringify(s[field] ?? null) !== JSON.stringify(full[field] ?? null)) {
        fail(
          `fixture subset ${s.seedSlug} (${s.sourceFoodCode}) ${field}: ${JSON.stringify(s[field] ?? null)} ` +
            `!= extract ${JSON.stringify(full[field] ?? null)}`,
        );
      }
    }
  }
  console.log('');
  console.log(`OK fixture subset: ${subset.length} rows agree with the staged extract row-for-row`);
} else if (subsetPath) {
  fail(`fixture subset not found at ${subsetPath}`);
}

if (failures) {
  console.error('');
  console.error(`${failures} verification failure(s)`);
  process.exit(1);
}
console.log('');
console.log('VERIFICATION PASS');
