/**
 * Imports e2e (pipeline-level, wired without HTTP — the pipeline is CLI-only):
 * A2 provenance, A3 DB↔fixture parity, A4 idempotency, A5 supersession, A22 atomicity.
 */
import { setTestEnv, truncateAll, fixtureBytes } from './db-utils';

setTestEnv();

import { PrismaService } from '../src/prisma/prisma.service';
import { ImportsService, FCT_SOURCE } from '../src/imports/imports.service';
import { ImportsRepository } from '../src/imports/imports.repository';
import { FctParser } from '../src/imports/fct-parser';
import { FctRowValidator } from '../src/imports/fct-row-validator';
import { Canonicalizer } from '../src/imports/canonicalizer';
import { Transliterator } from '../src/imports/transliterator';
import { CategoryMapper } from '../src/imports/category-mapper';
import { PortionStandards } from '../src/imports/portion-standards';
import { FctRow } from '../src/imports/fct-parser';
import { createHash } from 'node:crypto';

const prisma = new PrismaService();
const parser = new FctParser();
const service = new ImportsService(
  new ImportsRepository(prisma),
  parser,
  new FctRowValidator(),
  new Canonicalizer(new Transliterator()),
  new CategoryMapper(),
  new PortionStandards(),
);

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function importRows(rows: FctRow[]): ReturnType<ImportsService['importFile']> {
  const bytes = Buffer.from(JSON.stringify(rows));
  return service.importFile({
    fileName: 'test-extract.jsonl',
    fileSha256: sha256(bytes),
    rows,
    source: FCT_SOURCE,
  });
}

async function allFoodsWithSource(): Promise<
  {
    id: string;
    sourceFoodCode: string;
    per100gKcal: number;
    per100gProtein: number;
    per100gCarbs: number;
    per100gFat: number;
    per100gFiber: number | null;
    per100gSodiumMg: number | null;
    extraNutrients: unknown;
    status: string;
    sourceName: string | null;
    sourceVersion: string | null;
    sourceReference: string | null;
    importStartedAt: Date | null;
  }[]
> {
  const foods = await prisma.food.findMany({ include: { import: true } });
  return foods.map((f) => ({
    id: f.id,
    sourceFoodCode: f.sourceFoodCode,
    per100gKcal: f.per100gKcal,
    per100gProtein: f.per100gProtein,
    per100gCarbs: f.per100gCarbs,
    per100gFat: f.per100gFat,
    per100gFiber: f.per100gFiber,
    per100gSodiumMg: f.per100gSodiumMg,
    extraNutrients: f.extraNutrients,
    status: f.status,
    sourceName: f.import?.sourceName ?? null,
    sourceVersion: f.import?.sourceVersion ?? null,
    sourceReference: f.import?.sourceReference ?? null,
    importStartedAt: f.import?.startedAt ?? null,
  }));
}

beforeAll(async () => {
  await prisma.$connect();
  await truncateAll(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('import pipeline e2e', () => {
  const fixtureRows = parser.parse(fixtureBytes().toString('utf8'));

  it('A2/A4: imports the fixture; every food has non-null provenance', async () => {
    const outcome = await importRows(fixtureRows);
    expect(outcome.status).toBe('committed');

    const foods = await allFoodsWithSource();
    expect(foods).toHaveLength(18);
    for (const food of foods) {
      expect(food.sourceName).toBe(FCT_SOURCE.name);
      expect(food.sourceVersion).toBe(FCT_SOURCE.version);
      expect(food.sourceReference).toBe(FCT_SOURCE.reference);
      expect(food.sourceFoodCode).toMatch(/^\d{6}$/);
      expect(food.importStartedAt).not.toBeNull();
    }
  });

  it('A4: re-importing the same (source, version, sha256) is a no-op', async () => {
    const again = await importRows(fixtureRows);
    expect(again.status).toBe('skipped');
    const runs = await prisma.importRun.count();
    expect(runs).toBe(1);
  });

  it('A3: DB rows are byte-equal to the fixture rows (nutrition never invented)', async () => {
    const foods = await allFoodsWithSource();
    for (const row of fixtureRows) {
      const food = foods.find((f) => f.sourceFoodCode === row.sourceFoodCode);
      expect(food).toBeDefined();
      expect(food!.per100gKcal).toBe(row.per100g.kcal);
      expect(food!.per100gProtein).toBe(row.per100g.proteinG);
      expect(food!.per100gCarbs).toBe(row.per100g.carbsG);
      expect(food!.per100gFat).toBe(row.per100g.fatG);
      expect(food!.per100gFiber).toBe(
        typeof row.per100g.fiberG === 'number' ? row.per100g.fiberG : null,
      );
      expect(food!.per100gSodiumMg).toBe(
        typeof row.per100g.sodiumMg === 'number' ? row.per100g.sodiumMg : null,
      );
    }
  });

  /**
   * QA F-06: the A3 parity check above only covered six fields, so every
   * mineral, vitamin and fatty acid other than sodium — all of which live in
   * `extraNutrients` — could have been invented or mis-mapped without any test
   * noticing. This asserts the WHOLE block, value for value.
   */
  it('A3b: extraNutrients in the DB equals the fixture block exactly (F-06)', async () => {
    const foods = await allFoodsWithSource();
    for (const row of fixtureRows) {
      const food = foods.find((f) => f.sourceFoodCode === row.sourceFoodCode);
      expect(food).toBeDefined();

      const fixtureExtras: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row.per100g)) {
        if (
          [
            'kcal',
            'proteinG',
            'carbsG',
            'fatG',
            'fiberG',
            'sodiumMg',
          ].includes(key)
        ) {
          continue;
        }
        fixtureExtras[key] = value === undefined ? null : value;
      }

      const storedExtras = (food!.extraNutrients ?? {}) as Record<string, unknown>;
      // Same key set, same values — `tr` is preserved verbatim, absent stays null.
      expect(Object.keys(storedExtras).sort()).toEqual(Object.keys(fixtureExtras).sort());
      for (const key of Object.keys(fixtureExtras)) {
        expect({ code: row.sourceFoodCode, key, value: storedExtras[key] }).toEqual({
          code: row.sourceFoodCode,
          key,
          value: fixtureExtras[key],
        });
      }
    }
  });

  it('A5: a new sha256 supersedes in place; stale codes → Deprecated, never deleted', async () => {
    // Drop one food and change one value → different sha256, same source/version.
    const superset = fixtureRows
      .filter((r) => r.sourceFoodCode !== '010163') // pasta dropped
      .map((r) =>
        r.sourceFoodCode === '010109'
          ? { ...r, per100g: { ...r.per100g, kcal: 153 } } // injera updated
          : r,
      );
    const outcome = await importRows(superset);
    expect(outcome.status).toBe('committed');

    const runs = await prisma.importRun.count();
    expect(runs).toBe(2);

    const pasta = await prisma.food.findUnique({ where: { sourceFoodCode: '010163' } });
    expect(pasta).not.toBeNull();
    expect(pasta!.status).toBe('Deprecated'); // never hard-deleted

    const injera = await prisma.food.findUnique({ where: { sourceFoodCode: '010109' } });
    expect(injera!.status).toBe('Active');
    expect(injera!.per100gKcal).toBe(153);

    // Active foods of the new run == 17.
    const active = await prisma.food.count({ where: { status: 'Active' } });
    expect(active).toBe(17);
  });

  it('A22: an invalid row fails the run atomically — zero food changes', async () => {
    const before = await allFoodsWithSource();
    const bad: FctRow[] = [
      ...fixtureRows.map((r) => ({ ...r, per100g: { ...r.per100g } })),
      {
        sourceFoodCode: '999999',
        nameEn: 'Invalid test food',
        nameAm: null,
        page: null,
        per100g: { kcal: 9999, proteinG: 0, carbsG: 0, fatG: 0 },
      },
    ];
    const outcome = await importRows(bad);
    expect(outcome.status).toBe('failed');

    const run = await prisma.importRun.findUnique({ where: { id: outcome.importId } });
    expect(run!.status).toBe('Failed');

    const after = await allFoodsWithSource();
    expect(after).toEqual(before); // byte-identical — nothing changed
    const active = await prisma.food.count({ where: { status: 'Active' } });
    expect(active).toBe(17);
  });
});
