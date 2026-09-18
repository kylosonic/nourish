/**
 * Unit tests: FctRowValidator — required fields, numeric bounds, code
 * uniqueness. Any single failure aborts the run (A22).
 */
import { FctRowValidator } from '../src/imports/fct-row-validator';
import { FctRow } from '../src/imports/fct-parser';

const validator = new FctRowValidator();

function row(overrides: Partial<FctRow> & { per100g?: Record<string, unknown> }): FctRow {
  return {
    sourceFoodCode: '010109',
    nameEn: 'Enjera, teff, mixed',
    nameAm: 'Ye’teff enjera',
    page: 53,
    per100g: { kcal: 152, proteinG: 4.2, carbsG: 30.4, fatG: 1.3, fiberG: 2.1, sodiumMg: 10 },
    ...overrides,
  };
}

describe('FctRowValidator', () => {
  it('accepts a well-formed row', () => {
    const result = validator.validate([row({})]);
    expect(result).toEqual({ valid: true });
  });

  it('rejects a missing kcal', () => {
    const result = validator.validate([row({ per100g: { proteinG: 4.2, carbsG: 30.4, fatG: 1.3 } })]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'kcal')).toBe(true);
    }
  });

  it('rejects kcal outside 0..900 per 100g', () => {
    for (const kcal of [-1, 901]) {
      const result = validator.validate([row({ per100g: { kcal, proteinG: 4, carbsG: 5, fatG: 1 } })]);
      expect(result.valid).toBe(false);
    }
  });

  it('rejects negative macros', () => {
    const result = validator.validate([
      row({ per100g: { kcal: 152, proteinG: -1, carbsG: 30, fatG: 1 } }),
    ]);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate food codes', () => {
    const result = validator.validate([row({}), row({ nameEn: 'Other' })]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'sourceFoodCode')).toBe(true);
    }
  });

  it('rejects an empty English name', () => {
    const result = validator.validate([row({ nameEn: '   ' })]);
    expect(result.valid).toBe(false);
  });

  it('rejects non-numeric required macros ("tr" fat is not importable)', () => {
    const result = validator.validate([
      row({ per100g: { kcal: 60, proteinG: 13.5, carbsG: 1.4, fatG: 'tr' } }),
    ]);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'fatG')).toBe(true);
    }
  });
});
