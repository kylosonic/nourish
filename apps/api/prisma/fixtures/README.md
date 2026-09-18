# FCT 2025 fixture data — provenance and verification

## Source publication

- **Title:** The Ethiopian Food Composition Table 2025 — User Guide and Condensed Table
- **Publisher:** Ethiopian Public Health Institute (EPHI) and Food and Agriculture
  Organization of the United Nations (FAO), 2025. Addis Ababa, Ethiopia.
- **Citation (as published):** "Ethiopian Public Health Institute (EPHI) and Food and
  Agriculture Organization of the United Nations (FAO) 2025. The Ethiopian Food
  Composition Table 2025. Addis Ababa, Ethiopia."
- **FAO Knowledge Repository record:** https://openknowledge.fao.org/handle/20.500.14283/cd9308en
- **PDF bitstream (acquisition URL):**
  https://openknowledge.fao.org/server/api/core/bitstreams/22c422c5-4c66-4233-aa15-0cd6e6c47f6e/content
- **FAO-published text layer (used for double-entry verification; not committed):**
  https://openknowledge.fao.org/server/api/core/bitstreams/3389ccb5-03e0-437e-8800-8d22db3ff585/content
- **License (stated in the FAO record metadata):** CC BY 4.0
  (`dc.rights.license: "CC BY 4.0"` in the DSpace item metadata; publisher field:
  "Ethiopian Public Health Institute"). Attribution preserved in all derived artifacts.

## Acquisition record

| Field | Value |
|---|---|
| Download date | 2026-08-27 (re-acquired 2026-09-19 to re-derive the extract) |
| Source PDF file | `cd9308en.pdf` (3,942,702 bytes) — **never committed** |
| PDF sha256 | `66A1EBF351C09212F323E33019AE47CA60232D84344EB98CAF3A55C90936CF97` |
| Published text layer file | `cd9308en.pdf.txt` (684,206 bytes) — **never committed** |
| Text-layer sha256 | `D863F4188524552BB4AE867C59F3CE3818B6C18D01C011A997A48D5C04EF6C19` |
| Staged extract file | `fct-2025-extract.jsonl` (722 rows) — sha256 `57B24D75601780EACF4C760DD9AB6884BC217C0ACC30FB7A544C38AB9251C710` |
| Fixture subset file | `fct-2025-fixture-subset.jsonl` (18 rows) — sha256 `7B7EC2794062AA045266BE38C57DC29A5B4BE9B1A3AE41C594E5EC45EB92B0A1` |
| Extraction script | `apps/api/scripts/extract-fct.mjs` (pdfjs-dist **column-positional** parsing; deterministic) |
| Verification script | `apps/api/scripts/verify-extract.mjs` (column-by-column cross-check vs the FAO text layer) |

Reproduce: download the PDF and the text layer from the URLs above, verify both
sha256 values, then

```
node scripts/extract-fct.mjs <cd9308en.pdf>
node scripts/verify-extract.mjs <cd9308en.pdf.txt>     # exits non-zero on any mismatch
```

## What verification actually checks (and what it does not)

`verify-extract.mjs` compares the staged extract against FAO's own published text
layer of the same PDF, **column by column**, and exits non-zero on any value that
matches no published value. Its last full run reported:

- 722 extract rows; **3,510 row/block pairs compared** (every block of every row
  that the text layer rendered tractably); 3,483 of them are an exact multiset
  match of the published row.
- **27,571 individual values verified against a published value; 0 values matched
  nothing.** Per column, e.g. minerals: CA 711, FE 711, MG 711, P 711, K 711,
  NA 711, ZN 709, CU 707, MN 682, SE 699; vitamins and fatty acids likewise (the
  script prints the full per-column table on every run).
- 31 published cells the extract omits, all blank cells in the publication
  (by column: 3/FOL=10, 4/VITE=10, 4/VITD=5, 3/VITB12=1, plus intractable rows).
- **38 row/block pairs the text layer cannot support a verdict for** (it splits one
  printed number into two tokens, merges cells, or drops wrapped values). These are
  listed explicitly by the script and are **not** scored as matches; they rest on
  the extractor's PDF geometry instead, which is why the script also re-checks a
  hard-coded ground-truth set (codes `070152`, `080001`, `010109`) against the
  published values on every run.
- 4 row/block pairs whose extract values are a contiguous run of the published row
  starting after its first value: the shape of both blank leading cells and a
  left-shift, so they are reported loudly rather than silently accepted.

**Limits, stated plainly:** the text layer is a second rendering and is lossy; the
verifier states its own coverage rather than implying completeness. The 23 rows
that cannot be imported for energy reasons (below) are unaffected by this check.

The 18-row fixture subset is additionally re-checked row-for-row against the
staged extract on every run.

### Field-level guarantee for the F-01 defect class

The mineral block and the phytate/fatty-acid block were previously mis-aligned by a
value-to-tag shift (every tag received its neighbour's number). The extractor now
assigns each printed value to the column whose x-span contains it, so a blank cell
can never be filled by the next nutrient's number, and the verifier above would
catch a regression of that class.


## Coverage statement (D5 — never presented as the full catalog)

- The published **Condensed Food Composition Table** in the User Guide PDF contains
  **722 food rows**. Both independent extractions (this repo's positional parser and
  FAO's own text layer of the same PDF) agree on exactly 722 unique food codes.
- Table 1 of the same document reports **727 entries** for the full EFCT 2025 dataset;
  the difference is covered by the Excel datasheet distribution referenced in the
  document (not part of this PDF, not acquired in S1). **All S1 artifacts cover
  722 of 727 published entries and state this explicitly.**
- `fct-2025-extract.jsonl` = the staged extract of all 722 condensed-table rows.
- `fct-2025-fixture-subset.jsonl` = 18 of the 20 S0 seed foods matched to their FCT 2025
  entries (see mapping table below). Two S0 foods are excluded (see "Exclusions").
- 23 condensed-table rows cannot pass S1 import validation for energy reasons
  (the pipeline requires a published kcal; kcal is never derived — honesty rule):
  - **20 rows print energy in kJ only** (no kcal figure): `010078, 040001, 040097,
    050001, 050002, 050003, 050005, 050006, 050007, 050009, 090018, 110007, 110008,
    110009, 110010, 110011, 110012, 110013, 110014, 120011`.
  - **3 rows have a blank or malformed energy cell** in the published table:
    `030083, 170006, 170012`.
  - Completing these rows requires the full Excel datasheet — a tracked
    data-completeness item, not an extraction bug. `scripts/verify-extract.mjs`
    prints the same lists on every run.

## S0 seed → FCT 2025 mapping (fixture subset)

Every value in `fct-2025-fixture-subset.jsonl` is byte-identical to the corresponding
row of the staged extract (asserted on every verifier run), and the extract is itself
cross-checked column-by-column against FAO's published text layer as described above.

| S0 seed id | FCT code | FCT name (English) | Page | kcal/100g |
|---|---|---|---|---|
| injera | 010109 | Enjera, teff, mixed | 53 | 152 |
| doro_wot | 070152 | Chicken, meat, without skin, stew, with onion, oil, egg, spices, butter and salt | 223 | 219 |
| shiro_wot | 030088 | Pea, chickpea and broad bean spiced flours, stew, with onion, oil, salt and red pepper spice blend | 138 | 146 |
| misir_wot | 030093 | Lentil, split, stew, with oil, onion, tomato, red pepper spice blend, salt and garlic | 138 | 131 |
| kik_alicha | 030094 | Field peas, split, stew with onion, oil, garlic, green pepper, ginger, salt and turmeric | 133 | 166 |
| beef_tibs | 070156 | Beef, meat, lean, stir fried, with onion, tomato, oil, green pepper, butter and salt | 213 | 191 |
| chechebsa | 010191 | Chechebsa from refined white wheat flour unleavened bread with butter and red pepper spice blend | 48 | 349 |
| fuul | 030048 | Broad beans, seed, whole, dry, boiled, drained (without salt) | 118 | 110 |
| buna | 120007 | Coffee, beverage, prepared with tap water (boiled, without sugar) | 283 | 12 |
| kitfo | 070153 | Beef, meat, lean, minced, cooked with butter, spices and salt | 208 | 197 |
| gomen | 040050 | Ethiopian Kale, leaves, boiled, drained (without salt) | 158 | 36 |
| atkilt | 040085 | Cabbage and carrot, stew, with onion, oil, green pepper, garlic and salt | 153 | 114 |
| orange | 050012 | Orange, pulp, raw | 188 | 43 |
| egg | 080001 | Egg, chicken, whole, raw | 243 | 118 |
| milk | 100008 | Milk, cow, whole, fluid, pasteurized, unfortified | 263 | 64 |
| bread | 010133 | Bread, wheat, white, refined flour | 43 | 267 |
| rice | 010167 | Rice, white, polished (local), boiled, drained (without salt) | 83 | 117 |
| pasta | 010163 | Pasta (macaroni or spaghetti), white wheat refined flour, dry, unenriched, boiled, drained (without salt) | 73 | 122 |

Matching rule: closest published entry to the S0 food as commonly prepared, chosen
from the condensed table. Where the S0 name is generic ("Bread", "Rice"), the most
representative cooked/prepared entry was selected. All choices are recorded here —
the seed (provisional) values remain in the mobile app until the first catalog sync.

### Exclusions (kept as seed-bootstrap only; not in the import subset)

| S0 seed id | FCT code | Reason |
|---|---|---|
| avocado | 050003 | Entry exists ("Avocado, fresh, raw", page 188) but the condensed table prints energy as kJ only (644 kJ, no kcal). Excluded until the full datasheet provides kcal. |
| banana | 050005 | Entry exists ("Banana, fresh, ripe, raw", page 188) but energy is kJ only (444 kJ, no kcal). Excluded for the same reason. |

## Extraction conventions (verbatim transcription — no derived values)

- Bracketed values in the source (`[1.8]`) mark estimated/imputed cells; transcribed
  without brackets. No other transformation is applied to numbers.
- `tr` (trace, below quantifiable limit) is kept verbatim as the string `"tr"` in the
  JSONL; the import pipeline maps it to null for optional nutrient fields only.
- Energy cell `kJ(kcal)`: both values transcribed. Rows with kJ only have no `kcal`
  field and fail import validation (honesty rule — kcal is never derived).
- `carbsG` in the extract = the published "CHO available" column (FCT tagname
  CHOAVLDF). Fiber is published separately (FIBTG) and stored in `fiberG`.
- The Amharic name column is transcribed as printed (nameAm may be null when the
  table cell is blank).

## Never committed

- The source PDF itself (redistribution + size; attribution is preserved via this
  README, the sha256, and the acquisition URL).
