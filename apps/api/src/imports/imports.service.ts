import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ImportStatus } from '@prisma/client';
import { FctParser, FctRow } from './fct-parser';
import { FctRowValidator, FctRowError } from './fct-row-validator';
import { Canonicalizer, CanonicalFood } from './canonicalizer';
import { CANONICALIZATION_RULES_VERSION } from './transliterator';
import { CategoryMapper } from './category-mapper';
import { PortionStandards } from './portion-standards';
import { ImportsRepository, FoodUpsertInput } from './imports.repository';
import { NourishLogger } from '../common/logger/nourish-logger';

export const FCT_SOURCE = {
  name: 'ethiopian-fct-2025',
  version: '2025',
  reference:
    'Ethiopian Public Health Institute (EPHI) and Food and Agriculture Organization of the ' +
    'United Nations (FAO) 2025. The Ethiopian Food Composition Table 2025. Addis Ababa, Ethiopia.',
} as const;

export interface ImportFileInput {
  fileName: string;
  fileSha256: string;
  extractSha256?: string;
  sourceUrl?: string;
  rows: FctRow[];
  source?: { name: string; version: string; reference: string };
}

export type ImportOutcome =
  | { status: 'skipped'; importId: string; reason: 'idempotent-noop' }
  | { status: 'failed'; importId: string; errors: FctRowError[] }
  | { status: 'committed'; importId: string; upserted: number; deprecated: number };

/**
 * Import pipeline orchestration (blueprint §10, CLI-only — never HTTP):
 * validate → canonicalize → transactional upsert/deprecate → verify.
 * Nutrition values pass through untouched; portion weights are Nourish
 * standard measures (portionSource: nourish-standard, D3).
 */
@Injectable()
export class ImportsService {
  private readonly logger = new NourishLogger('import');

  constructor(
    private readonly repo: ImportsRepository,
    private readonly parser: FctParser,
    private readonly validator: FctRowValidator,
    private readonly canonicalizer: Canonicalizer,
    private readonly categoryMapper: CategoryMapper,
    private readonly portionStandards: PortionStandards,
  ) {}

  async importFile(input: ImportFileInput): Promise<ImportOutcome> {
    const source = input.source ?? FCT_SOURCE;

    // Stage 5 gate: same (source, version, sha256, rules) → no-op (A4).
    const existing = await this.repo.findCommittedByTriple(
      source.name,
      source.version,
      input.fileSha256,
      CANONICALIZATION_RULES_VERSION,
    );
    if (existing) {
      this.logger.log('idempotent skip', { sha256: input.fileSha256, importId: existing.id });
      return { status: 'skipped', importId: existing.id, reason: 'idempotent-noop' };
    }

    const run = await this.repo.createRun({
      sourceName: source.name,
      sourceVersion: source.version,
      sourceReference: source.reference,
      sourceUrl: input.sourceUrl,
      fileName: input.fileName,
      fileSha256: input.fileSha256,
      extractSha256: input.extractSha256,
      rulesVersion: CANONICALIZATION_RULES_VERSION,
      rowCount: input.rows.length,
    });

    // Stage 3: validation — any failure aborts the whole run (A22).
    const validation = this.validator.validate(input.rows);
    if (!validation.valid) {
      const notes = `validation failed: ${validation.errors.length} error(s) — ${validation.errors
        .slice(0, 10)
        .map((e) => `${e.code}:${e.field} ${e.message}`)
        .join('; ')}`;
      await this.repo.markStatus(run.id, ImportStatus.Failed, notes);
      this.logger.error('validation failed', { importId: run.id, errors: validation.errors.length });
      return { status: 'failed', importId: run.id, errors: validation.errors };
    }

    // Stage 4: canonicalize (ids, names, aliases, categories, portions).
    const result = this.canonicalizer.canonicalize(input.rows);
    const upsertInputs: FoodUpsertInput[] = result.foods.map((food) =>
      this.toUpsertInput(food, this.categoryMapper.map(this.rowOf(input.rows, food.sourceFoodCode))),
    );
    for (const w of result.warnings) this.logger.warn('canonicalize', { warning: w });

    // Stage 5: transactional write (supersession inside the same transaction).
    const applied = await this.repo.applyImport(run, upsertInputs);

    // Stage 6: post-import verification.
    const active = await this.repo.countFoodsByImport(run.id);
    if (active !== input.rows.length) {
      const notes = `post-import count mismatch: expected ${input.rows.length} active foods, found ${active}`;
      await this.repo.markStatus(run.id, ImportStatus.Failed, notes);
      this.logger.error('verification failed', { importId: run.id, expected: input.rows.length, active });
      return { status: 'failed', importId: run.id, errors: [{ code: run.id, field: 'count', message: notes }] };
    }

    await this.repo.markStatus(run.id, ImportStatus.Committed, null);
    this.logger.log('committed', {
      importId: run.id,
      upserted: applied.upserted,
      deprecated: applied.deprecated,
    });
    return {
      status: 'committed',
      importId: run.id,
      upserted: applied.upserted,
      deprecated: applied.deprecated,
    };
  }

  /** Parse JSONL text into rows (stage 2 entry point for the CLI). */
  parseJsonl(text: string): FctRow[] {
    return this.parser.parse(text);
  }

  /** Catalog version: sha256(importId + canonical JSON) (blueprint §10). */
  catalogVersion(importId: string, canonicalJson: string): string {
    return createHash('sha256').update(importId + canonicalJson, 'utf8').digest('hex');
  }

  private rowOf(rows: FctRow[], code: string): FctRow {
    const row = rows.find((r) => r.sourceFoodCode === code);
    if (!row) throw new Error(`internal: missing source row for ${code}`);
    return row;
  }

  private toUpsertInput(food: CanonicalFood, categoryCode: string): FoodUpsertInput {
    const plan = this.portionStandards.plan(food);
    return {
      food,
      categoryCode,
      defaultPortion: plan.defaultPortion,
      portions: plan.portions,
      canonicalName: food.canonicalName,
      extraNutrients: food.per100g.extra,
    };
  }
}
