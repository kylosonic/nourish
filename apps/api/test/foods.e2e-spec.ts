/**
 * Foods e2e (HTTP): A1 healthz, A6 alias resolution EN+AM, A7 category +
 * pagination bounds, A8 validation/404 envelopes, TGT-02 portion standards.
 */
import { setTestEnv, truncateAll, fixtureBytes } from './db-utils';

setTestEnv();

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { EnvVars } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { ImportsService, FCT_SOURCE } from '../src/imports/imports.service';
import { ImportsRepository } from '../src/imports/imports.repository';
import { FctParser } from '../src/imports/fct-parser';
import { FctRowValidator } from '../src/imports/fct-row-validator';
import { Canonicalizer } from '../src/imports/canonicalizer';
import { Transliterator } from '../src/imports/transliterator';
import { CategoryMapper } from '../src/imports/category-mapper';
import { PortionStandards } from '../src/imports/portion-standards';
import { createHash } from 'node:crypto';

let app: NestExpressApplication;
let prisma: PrismaService;

async function importFixture(): Promise<void> {
  const bytes = fixtureBytes();
  const parser = new FctParser();
  const service = new ImportsService(
    new ImportsRepository(prisma),
    parser,
    new FctRowValidator(),
    new Canonicalizer(new Transliterator()),
    new CategoryMapper(),
    new PortionStandards(),
  );
  const outcome = await service.importFile({
    fileName: 'fct-2025-fixture-subset.jsonl',
    fileSha256: createHash('sha256').update(bytes).digest('hex').toUpperCase(),
    rows: parser.parse(bytes.toString('utf8')),
    source: FCT_SOURCE,
  });
  expect(outcome.status).toBe('committed');
}

beforeAll(async () => {
  process.env.RATE_LIMIT_LIMIT = '1000'; // per-app in-memory throttle; keep suites independent
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, app.get(ConfigService<EnvVars, true>));
  await app.init();
  prisma = app.get(PrismaService);
  await truncateAll(prisma);
  await importFixture();
});

afterAll(async () => {
  await app?.close();
});

describe('GET /v1/healthz (A1)', () => {
  it('reports ok with db up', async () => {
    const res = await request(app.getHttpServer()).get('/v1/healthz').expect(200);
    expect(res.body).toEqual({ status: 'ok', service: 'nourish-api', version: '0.1.0-s1', db: 'up' });
  });
});

describe('GET /v1/foods (LOG-05 / A6 / A7)', () => {
  it('A6: q=doro+wet and q=ዶሮ ወጥ resolve to the same canonical food', async () => {
    const en = await request(app.getHttpServer()).get('/v1/foods').query({ q: 'doro wet' }).expect(200);
    const am = await request(app.getHttpServer()).get('/v1/foods').query({ q: 'ዶሮ ወጥ' }).expect(200);
    expect(en.body.data.length).toBeGreaterThan(0);
    expect(am.body.data.length).toBeGreaterThan(0);
    expect(am.body.data[0].id).toBe(en.body.data[0].id);
    expect(am.body.data[0].id).toBe('doro_wot');
  });

  it('A7: category filter returns only that category', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods').query({ category: 'breakfast' }).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const food of res.body.data) {
      expect(food.category).toBe('Breakfast');
    }
    expect(res.body.meta.total).toBe(6);
  });

  it('A7: pagination meta (total/hasNextPage) and bounds (limit=1)', async () => {
    const page1 = await request(app.getHttpServer()).get('/v1/foods').query({ page: 1, limit: 1 }).expect(200);
    expect(page1.body.data).toHaveLength(1);
    expect(page1.body.meta).toEqual({ page: 1, limit: 1, total: 18, hasNextPage: true });

    const page18 = await request(app.getHttpServer()).get('/v1/foods').query({ page: 18, limit: 1 }).expect(200);
    expect(page18.body.meta.hasNextPage).toBe(false);
    expect(page18.body.data[0].id).not.toBe(page1.body.data[0].id);
  });

  it('returns FoodSummary shape with source block', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods').query({ q: 'injera' }).expect(200);
    const injera = res.body.data.find((f: { id: string }) => f.id === 'injera');
    expect(injera).toMatchObject({
      id: 'injera',
      canonicalName: 'Enjera, teff, mixed',
      category: 'Ethiopian',
      defaultPortion: { unit: 'injera', quantity: 1, grams: 150 },
      per100g: { kcal: 152, proteinG: 4.2, carbsG: 29.1, fatG: 1.3 },
      source: { name: 'ethiopian-fct-2025', version: '2025' },
    });
  });

  /**
   * QA F-04: transliterating every word of the FCT description made common
   * INGREDIENT words into aliases of many composite dishes — "ጨው" (salt) was an
   * alias of 11 foods and "ሽንኩርት" (onion) of 6, so a search for an ingredient
   * returned stews. Component words are no longer generated as aliases when the
   * name also carries a specific food term.
   */
  it('F-04: an ingredient word is no longer an alias of every dish', async () => {
    const salt = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: 'ጨው' }) // salt
      .expect(200);
    expect(salt.body.meta.total).toBeLessThanOrEqual(2);

    const onion = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: 'ሽንኩርት' }) // onion
      .expect(200);
    expect(onion.body.meta.total).toBe(0);

    const egg = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: 'እንቁላል' }) // egg
      .expect(200);
    expect(egg.body.meta.total).toBeLessThanOrEqual(2);

    // A condiment actually named for the component keeps its own alias.
    const injera = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: 'እንጀራ' })
      .expect(200);
    expect(injera.body.data.map((f: { id: string }) => f.id)).toContain('injera');
  });
});

describe('GET /v1/foods/categories', () => {
  it('returns the §8 ordered category list (declared before /:id)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods/categories').expect(200);
    expect(res.body).toEqual({ data: ['Ethiopian', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'] });
  });
});

describe('GET /v1/foods/:id (TGT-05 / TGT-02)', () => {
  it('returns the full Food shape with aliases, portions and source block', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods/doro_wot').expect(200);
    const food = res.body;
    expect(food.id).toBe('doro_wot');
    expect(food.source.foodCode).toBe('070152');
    expect(food.source.reference).toContain('Ethiopian Food Composition Table 2025');
    expect(food.source.importDate).toEqual(expect.any(String));
    expect(food.aliases.length).toBeGreaterThan(0);
    expect(food.aliases.some((a: { alias: string }) => a.alias === 'ዶሮ ወጥ')).toBe(true);
  });

  it('TGT-02: every portion carries portionSource nourish-standard and DB-backed grams', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods/doro_wot').expect(200);
    const dbFood = await prisma.food.findUnique({
      where: { id: 'doro_wot' },
      include: { portions: true },
    });
    expect(dbFood).not.toBeNull();
    for (const portion of res.body.portions) {
      expect(portion.portionSource).toBe('nourish-standard');
    }
    expect(res.body.defaultPortion.grams).toBe(dbFood!.defaultPortionGrams);
    expect(res.body.defaultPortion.unit).toBe(dbFood!.defaultPortionUnit);
    for (const portion of res.body.portions) {
      const dbPortion = dbFood!.portions.find((p) => p.unit === portion.unit);
      expect(dbPortion).toBeDefined();
      expect(portion.grams).toBe(dbPortion!.grams);
    }
  });

  it('A8: unknown id → 404 with the error envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods/does-not-exist').expect(404);
    expect(res.body.error).toMatchObject({ code: 'FOOD_NOT_FOUND' });
    expect(res.body.error.requestId).toEqual(expect.any(String));
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });
});

describe('validation (A7 bounds / A8)', () => {
  it('limit > 100 → 400 VALIDATION_ERROR envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods').query({ limit: 101 }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('limit');
  });

  it('page < 1 → 400', async () => {
    await request(app.getHttpServer()).get('/v1/foods').query({ page: 0 }).expect(400);
  });

  it('q > 100 chars → 400', async () => {
    const long = 'a'.repeat(101);
    await request(app.getHttpServer()).get('/v1/foods').query({ q: long }).expect(400);
  });

  it('category outside the whitelist → 400', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods').query({ category: 'bogus' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('unknown query params are rejected (whitelist)', async () => {
    await request(app.getHttpServer()).get('/v1/foods').query({ evil: 'x' }).expect(400);
  });
});
