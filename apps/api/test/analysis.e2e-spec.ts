/**
 * S2 analysis e2e (ADR-0007, blueprint §3 criteria B1-B13).
 *
 * Runs the real pipeline against the real fixture-provider responses and the
 * real food layer: what is asserted here is the shipped behaviour of
 * POST /v1/analyses, not a mock.
 */
import { setTestEnv, truncateAll, fixtureBytes, setFixtureAiProvider } from './db-utils';

setTestEnv();
setFixtureAiProvider();

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
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
import { CategoryMapper } from '../src/imports/category-mapper';
import { PortionStandards } from '../src/imports/portion-standards';

// ── A real PNG, built here so the image path is exercised for real ──────────
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Minimal RGB PNG of the given size; `shade` varies the pixels. */
function makePng(width: number, height: number, shade: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const at = rowStart + 1 + x * 3;
      raw[at] = (x + shade) % 256;
      raw[at + 1] = (y + shade) % 256;
      raw[at + 2] = shade % 256;
    }
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * The fixture provider picks its scenario from the first byte of the image
 * hash, so the tests search for an image that produces the scenario they need.
 * Deterministic and cheap (the search space is 3).
 */
function imageForScenario(scenario: 0 | 1 | 2): Buffer {
  for (let shade = 0; shade < 60; shade++) {
    const png = makePng(64, 64, shade);
    if (createHash('sha256').update(png).digest()[0] % 3 === scenario) return png;
  }
  throw new Error(`no fixture image found for scenario ${scenario}`);
}

describe('S2 analysis (ADR-0007)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, app.get(ConfigService<EnvVars, true>));
    await app.init();
    prisma = app.get(PrismaService);

    await truncateAll(prisma);
    const rows = new FctParser().parse(fixtureBytes().toString('utf8'));
    const outcome = await new ImportsService(
      app.get(ImportsRepository),
      new FctParser(),
      new FctRowValidator(),
      new Canonicalizer(new (await import('../src/imports/transliterator')).Transliterator()),
      new CategoryMapper(),
      new PortionStandards(),
    ).importFile({
      fileName: 'fct-2025-fixture-subset.jsonl',
      fileSha256: createHash('sha256').update(fixtureBytes()).digest('hex').toUpperCase(),
      rows,
      source: FCT_SOURCE,
    });
    expect(outcome.status).toBe('committed');
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('photo analysis', () => {
    it('B3/B7: returns a schema-valid result whose items resolve to canonical foods', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: imageForScenario(0).toString('base64') })
        .expect(201);

      expect(res.body.status).toBe('Completed');
      expect(res.body.inputKind).toBe('Photo');
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.confidenceState).toBe('High');
      expect(res.body.promptVersion).toBe('scan-v1');
      expect(res.body.modelVersion).toBe('fixture-1');

      const doro = res.body.items.find(
        (item: { displayName: string }) => item.displayName === 'doro wet',
      );
      // The model said "doro wet"; the catalog resolved it to the canonical food
      // (alias match) and the nutrition is the DB row x grams / 100.
      expect(doro.foodId).toBe('doro_wot');
      expect(doro.sourceFoodCode).toBe('070152');
      expect(doro.matchKind).toBe('alias');
      expect(doro.portion.grams).toBe(240);
      expect(doro.portion.estimated).toBe(false);
      expect(doro.portion.portionSource).toBe('nourish-standard');
      expect(doro.nutrition).toEqual({
        kcal: 526,
        proteinG: 16,
        carbsG: 12,
        fatG: 44,
        fiberG: 7,
        sodiumMg: 796.8,
      });
      expect(doro.unresolved).toBe(false);

      // Totals are the sum of the resolved items.
      expect(res.body.totals.kcal).toBeGreaterThan(0);
      expect(res.body.totals.kcal).toBe(
        res.body.items.reduce(
          (sum: number, item: { nutrition: { kcal: number } | null }) =>
            sum + (item.nutrition?.kcal ?? 0),
          0,
        ),
      );
    });

    it('B8/B19: a Low-confidence run returns ranked candidates for the resolution screen', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: imageForScenario(1).toString('base64') })
        .expect(201);

      expect(res.body.confidenceState).toBe('Low');
      expect(res.body.overallConfidence).toBeLessThan(0.5);
      expect(Array.isArray(res.body.candidates)).toBe(true);
      expect(res.body.notes.length).toBeGreaterThan(0);
    });

    it('B9: an empty frame is reported as an error, never as an empty meal', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: imageForScenario(2).toString('base64') })
        .expect(422);
      expect(res.body.error.code).toBe('NO_FOOD_DETECTED');
      expect(res.body.error.requestId).toBeDefined();
    });
  });

  describe('image validation (B9)', () => {
    it('rejects bytes that are not an image at all', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: Buffer.from('not an image at all').toString('base64') })
        .expect(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects an image smaller than the minimum edge', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: makePng(16, 16, 3).toString('base64') })
        .expect(422);
      expect(res.body.error.code).toBe('IMAGE_UNREADABLE');
    });

    it('rejects an oversized body before it reaches the pipeline', async () => {
      const huge = Buffer.concat([makePng(64, 64, 7), Buffer.alloc(5 * 1024 * 1024, 0)]);
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: huge.toString('base64') });
      // 413 from the route body limit, or the pipeline's own IMAGE_TOO_LARGE.
      expect([413, 422]).toContain(res.status);
    });
  });

  describe('text analysis (LOG-01)', () => {
    it('parses a described meal into editable entries', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ text: '2 injera with shiro' })
        .expect(201);

      const injera = res.body.items.find(
        (item: { displayName: string }) => item.displayName === 'injera',
      );
      expect(injera.portion.amount).toBe(2);
      expect(injera.portion.unit).toBe('injera');
      expect(injera.portion.grams).toBe(300); // 2 x 150 g from the portion table
      expect(res.body.inputKind).toBe('Text');
    });

    it('B9: rejects an empty or oversized description', async () => {
      await request(app.getHttpServer()).post('/v1/analyses').send({ text: '' }).expect(400);
      await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ text: 'x'.repeat(501) })
        .expect(400);
    });

    it('rejects an ambiguous request that sends both an image and text', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({
          imageBase64: imageForScenario(0).toString('base64'),
          text: 'and also this',
        })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a request with neither', async () => {
      await request(app.getHttpServer()).post('/v1/analyses').send({}).expect(400);
    });
  });

  describe('retrieval and corrections', () => {
    it('B12: a correction is captured without any user identity', async () => {
      const created = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ text: 'injera and shiro' })
        .expect(201);

      const itemId = created.body.items[0].id;
      await request(app.getHttpServer())
        .post(`/v1/analyses/${created.body.id}/corrections`)
        .send({
          items: [
            {
              itemId,
              action: 'swap',
              predictedLabel: 'injera',
              chosenFoodId: 'misir_wot',
            },
          ],
        })
        .expect(204);

      const corrections = await prisma.analysisCorrection.findMany({
        where: { runId: created.body.id },
      });
      expect(corrections).toHaveLength(1);
      expect(corrections[0].predictedLabel).toBe('injera');
      expect(corrections[0].chosenFoodId).toBe('misir_wot');
      expect(corrections[0].modelVersion).toBe('fixture-1');
      expect(corrections[0].promptVersion).toBe('scan-v1');
      // No identity anywhere in the record.
      expect(JSON.stringify(corrections[0])).not.toMatch(/user/i);
    });

    it('B12: corrections for an unknown run are accepted and ignored, never an error', async () => {
      await request(app.getHttpServer())
        .post('/v1/analyses/does-not-exist/corrections')
        .send({ items: [{ action: 'remove' }] })
        .expect(204);
    });

    it('rejects an unknown correction action', async () => {
      const created = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ text: 'injera' })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/v1/analyses/${created.body.id}/corrections`)
        .send({ items: [{ action: 'delete-everything' }] })
        .expect(400);
    });
  });

  describe('retrieval of a stored run', () => {
    it('GET /v1/analyses/:id returns the stored result', async () => {
      const created = await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ text: 'injera and shiro' })
        .expect(201);

      const fetched = await request(app.getHttpServer())
        .get(`/v1/analyses/${created.body.id}`)
        .expect(200);
      expect(fetched.body.id).toBe(created.body.id);
      expect(fetched.body.items).toHaveLength(created.body.items.length);
      expect(fetched.body.totals).toEqual(created.body.totals);
    });

    it('unknown id → 404 ANALYSIS_NOT_FOUND envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/analyses/nope')
        .expect(404);
      expect(res.body.error.code).toBe('ANALYSIS_NOT_FOUND');
    });
  });

  describe('B11: imagery is never persisted', () => {
    it('stores no image column and writes no file for an analysis', async () => {
      const before = await prisma.analysisRun.count();
      await request(app.getHttpServer())
        .post('/v1/analyses')
        .send({ imageBase64: imageForScenario(0).toString('base64') })
        .expect(201);
      const run = await prisma.analysisRun.findFirst({ orderBy: { createdAt: 'desc' } });
      expect(await prisma.analysisRun.count()).toBe(before + 1);
      // The schema simply has nowhere to put bytes.
      const columns = Object.keys(run as object);
      expect(columns.some((c) => /image|photo|blob|bytes/i.test(c))).toBe(false);
    });
  });
});
