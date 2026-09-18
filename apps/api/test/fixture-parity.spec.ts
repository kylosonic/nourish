/**
 * Unit tests: fixture parity (A3) — the import pipeline NEVER mutates
 * nutrition values. Every per-100g number that reaches the DB must be
 * byte-equal to the staged fixture row it came from. (DB-level parity is
 * asserted in imports.e2e-spec.ts, which has a database.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { FctParser } from '../src/imports/fct-parser';
import { FctRowValidator } from '../src/imports/fct-row-validator';
import { Canonicalizer } from '../src/imports/canonicalizer';
import { Transliterator } from '../src/imports/transliterator';
import { CategoryMapper } from '../src/imports/category-mapper';

const FIXTURE = path.resolve(__dirname, '../prisma/fixtures/fct-2025-fixture-subset.jsonl');

const parser = new FctParser();
const validator = new FctRowValidator();
const canonicalizer = new Canonicalizer(new Transliterator());
const categories = new CategoryMapper();

/** S0 seed categories for the 18 matched foods (apps/mobile/lib/data/seed/seed_catalog.dart). */
const SEED_CATEGORIES: Record<string, string> = {
  injera: 'ethiopian',
  doro_wot: 'ethiopian',
  shiro_wot: 'ethiopian',
  misir_wot: 'ethiopian',
  kik_alicha: 'ethiopian',
  beef_tibs: 'ethiopian',
  kitfo: 'ethiopian',
  gomen: 'ethiopian',
  atkilt: 'ethiopian',
  chechebsa: 'breakfast',
  fuul: 'breakfast',
  buna: 'breakfast',
  egg: 'breakfast',
  milk: 'breakfast',
  bread: 'breakfast',
  rice: 'lunch',
  pasta: 'dinner',
  orange: 'snacks',
};

describe('fixture parity (A3 — honesty)', () => {
  const rows = parser.parse(fs.readFileSync(FIXTURE, 'utf8'));

  it('parses the committed fixture subset', () => {
    expect(rows.length).toBe(18);
  });

  it('validates clean — every fixture row is importable', () => {
    const result = validator.validate(rows);
    expect(result).toEqual({ valid: true });
  });

  it('nutrition values pass through the pipeline byte-equal', () => {
    const result = canonicalizer.canonicalize(rows);
    expect(result.foods.length).toBe(rows.length);
    for (const row of rows) {
      const canonical = result.foods.find((f) => f.sourceFoodCode === row.sourceFoodCode);
      expect(canonical).toBeDefined();
      for (const field of ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'sodiumMg'] as const) {
        // Absent-in-JSON (undefined) and explicit null are the same "no value"
        // — the pipeline's only transformation of optional fields.
        const expected = typeof row.per100g[field] === 'number' ? row.per100g[field] : null;
        expect(canonical!.per100g[field]).toBe(expected);
      }
    }
  });

  it('every fixture food resolves to its S0 category', () => {
    const result = canonicalizer.canonicalize(rows);
    for (const canonical of result.foods) {
      const row = rows.find((r) => r.sourceFoodCode === canonical.sourceFoodCode)!;
      const expected = SEED_CATEGORIES[canonical.id];
      expect(expected).toBeDefined();
      expect(categories.map(row)).toBe(expected);
    }
  });

  it('fixture row nutrition values carry FCT page citations', () => {
    for (const row of rows) {
      expect(typeof row.page).toBe('number');
      expect(row.page).toBeGreaterThan(30);
    }
  });

  /**
   * QA F-01 regression: the mineral block was once systematically left-shifted
   * (each tag received its neighbour's published number, and Calcium was lost).
   * These are the values the publication prints for these foods; if a future
   * extractor change re-introduces a value-to-tag shift, this fails loudly.
   * Source: FCT 2025 condensed table, verified column-by-column against FAO's
   * published text layer (scripts/verify-extract.mjs).
   */
  it('mineral block matches the published columns (F-01 regression)', () => {
    const expected: Record<
      string,
      Partial<Record<string, number | string>>
    > = {
      // doro wot — page 223
      '070152': {
        calciumMg: 24,
        ironMg: 1.2,
        magnesiumMg: 16,
        phosphorusMg: 85,
        potassiumMg: 167,
        sodiumMg: 332,
        zincMg: 0.62,
        copperMg: 0.09,
        manganeseMg: 0.25,
        seleniumUg: 6,
      },
      // egg, chicken, whole, raw — page 243
      '080001': {
        calciumMg: 38,
        ironMg: 1.8,
        magnesiumMg: 11,
        phosphorusMg: 138,
        potassiumMg: 108,
        sodiumMg: 137,
        zincMg: 0.97,
        copperMg: 0.05,
        manganeseMg: 0.02,
        seleniumUg: 28,
      },
      // enjera, teff, mixed — page 53
      '010109': {
        calciumMg: 66,
        ironMg: 11.1,
        magnesiumMg: 76,
        phosphorusMg: 118,
        potassiumMg: 156,
        sodiumMg: 12,
        zincMg: 1.2,
        copperMg: 0.23,
        manganeseMg: 3.99,
        seleniumUg: 10,
      },
    };

    for (const [code, minerals] of Object.entries(expected)) {
      const row = rows.find((r) => r.sourceFoodCode === code);
      expect(row).toBeDefined();
      for (const [field, value] of Object.entries(minerals)) {
        expect({ code, field, value: row!.per100g[field] }).toEqual({
          code,
          field,
          value,
        });
      }
    }
  });

  it('phytate/cholesterol block matches the published columns (F-01 regression)', () => {
    // The same shift also corrupted this block: for egg the published
    // PHYTCPP=0 / CHOLE=292 / FASAT=2.02 once arrived as 292 / 2.02 / 2.59.
    const egg = rows.find((r) => r.sourceFoodCode === '080001')!;
    expect(egg.per100g.phytateMg).toBe(0);
    expect(egg.per100g.cholesterolMg).toBe(292);
    expect(egg.per100g.saturatedFatG).toBe(2.02);
    expect(egg.per100g.monounsaturatedFatG).toBe(2.59);
    expect(egg.per100g.polyunsaturatedFatG).toBe(1.26);
  });
});
