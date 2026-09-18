import { FctRow } from './fct-parser';

export interface FctRowError {
  code: string;
  field: string;
  message: string;
}

/** Honesty rule: kcal is never derived. Required numeric fields must be published numbers. */
const REQUIRED_NUMERIC = ['kcal', 'proteinG', 'carbsG', 'fatG'] as const;

const OPTIONAL_NUMERIC = ['fiberG', 'sodiumMg', 'energyKj'] as const;

/**
 * Upper bounds for every numeric column (QA finding F-04, deferred to S3 by the
 * S1 security record, closed here).
 *
 * The validator previously only rejected negative optional values, so a
 * corrupted or hand-edited extract could carry `sodiumMg: 99999999` straight
 * into the database. These ceilings are physical plausibility limits for a
 * per-100 g food composition value, not product preferences: nothing edible
 * contains more than 100 g of a macronutrient or fibre per 100 g, and the
 * mineral/vitamin ceilings are generous multiples of the highest value the
 * published table contains (e.g. sodium tops out at 672 mg/100 g in the FCT).
 * They are deliberately loose — the point is to catch corruption, not to
 * second-guess the publication.
 */
export const NUMERIC_BOUNDS: Record<string, number> = {
  kcal: 900, // pure fat is ~900 kcal/100 g
  proteinG: 100,
  carbsG: 100,
  fatG: 100,
  fiberG: 100,
  // Generous ceilings: the published maximum is 672 mg/100 g.
  sodiumMg: 40000,
  // kJ for the same 900 kcal/100 g ceiling, rounded up.
  energyKj: 4000,
};

/**
 * Ceiling applied to every other published nutrient in the row (minerals,
 * vitamins, fatty acids, phytate). The largest value the FCT 2025 condensed
 * table contains is a few hundred mg/100 g and a few hundred µg for the trace
 * vitamins, so 100 000 is far above any real reading while still catching a
 * corrupted magnitude.
 */
const EXTRA_NUTRIENT_MAX = 100000;

/**
 * Pre-import validation (blueprint §10 stage 3). Any single failure aborts the
 * whole run: ImportRun → Failed, zero rows changed (A22).
 */
export class FctRowValidator {
  validate(rows: FctRow[]): { valid: true } | { valid: false; errors: FctRowError[] } {
    const errors: FctRowError[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const code = row.sourceFoodCode;

      if (!/^\d{6}$/.test(code)) {
        errors.push({ code, field: 'sourceFoodCode', message: 'must be a 6-digit food code' });
      }
      if (seen.has(code)) {
        errors.push({ code, field: 'sourceFoodCode', message: 'duplicate food code in extract' });
      }
      seen.add(code);

      if (!row.nameEn?.trim()) {
        errors.push({ code, field: 'nameEn', message: 'required' });
      } else if (row.nameEn.trim().length > 200) {
        errors.push({ code, field: 'nameEn', message: 'must be at most 200 characters' });
      }

      for (const field of REQUIRED_NUMERIC) {
        const value = row.per100g[field];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          errors.push({
            code,
            field,
            message: `must be a published numeric value (got ${JSON.stringify(value)})`,
          });
          continue;
        }
        if (field === 'kcal') {
          if (value < 0 || value > 900) {
            errors.push({ code, field, message: 'kcal must be within 0..900 per 100g' });
          }
        } else if (value < 0 || value > 100) {
          errors.push({ code, field, message: `${field} must be within 0..100 g per 100g` });
        }
      }

      for (const field of OPTIONAL_NUMERIC) {
        const value = row.per100g[field];
        if (value == null) continue;
        // 'tr' (trace, below quantifiable limit) is a published marker; it is
        // stored as null for optional fields (absence is the faithful form —
        // trace is never converted to a number).
        if (value === 'tr') continue;
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          errors.push({ code, field, message: `must be a non-negative number when present` });
          continue;
        }
        const max = NUMERIC_BOUNDS[field];
        if (max != null && value > max) {
          errors.push({
            code,
            field,
            message: `${field} must be at most ${max} per 100g (got ${value})`,
          });
        }
      }

      // Every remaining published nutrient the extract carries (minerals,
      // vitamins, fatty acids) is bounded too: an unbounded optional value is
      // exactly how a corrupted extract reaches the API unnoticed.
      for (const [field, value] of Object.entries(row.per100g)) {
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;
        if (value < 0) {
          errors.push({ code, field, message: 'must not be negative' });
          continue;
        }
        const max = EXTRA_NUTRIENT_MAX;
        if (value > max) {
          errors.push({
            code,
            field,
            message: `${field} must be at most ${max} per 100g (got ${value})`,
          });
        }
      }
    }

    if (errors.length) {
      return { valid: false, errors };
    }
    return { valid: true };
  }
}
