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
        }
      }
    }

    if (errors.length) {
      return { valid: false, errors };
    }
    return { valid: true };
  }
}
