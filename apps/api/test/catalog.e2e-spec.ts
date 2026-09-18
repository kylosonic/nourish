/**
 * Catalog e2e (A9): full snapshot with version + sha256; If-None-Match → 304.
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

beforeAll(async () => {
  process.env.RATE_LIMIT_LIMIT = '1000';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, app.get(ConfigService<EnvVars, true>));
  await app.init();
  prisma = app.get(PrismaService);
  await truncateAll(prisma);

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
});

afterAll(async () => {
  await app?.close();
});

describe('GET /v1/catalog (A9)', () => {
  it('returns the full snapshot: version, sha256, all foods with source blocks', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    expect(res.headers.etag).toBeDefined();
    expect(res.body.version).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.generatedAt).toEqual(expect.any(String));
    expect(res.body.foods).toHaveLength(18);
    for (const food of res.body.foods) {
      expect(food.source.foodCode).toMatch(/^\d{6}$/);
      expect(food.source.name).toBe('ethiopian-fct-2025');
      expect(food.portions.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic: version and sha256 are stable across requests', async () => {
    const first = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    const second = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    expect(second.body.version).toBe(first.body.version);
    expect(second.body.sha256).toBe(first.body.sha256);
  });

  it('If-None-Match with the current version → 304, empty body', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    const cached = await request(app.getHttpServer())
      .get('/v1/catalog')
      .set('If-None-Match', res.body.version)
      .expect(304);
    expect(cached.text).toBe('');
  });

  it('a stale If-None-Match → 200 with the full snapshot', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/catalog')
      .set('If-None-Match', '"old-version"')
      .expect(200);
    expect(res.body.foods).toHaveLength(18);
  });

  // QA F-10: the ETag was the bare version string (not RFC 9110 quoted) and was
  // compared with strict equality, so any client that echoed the server's own
  // validator — or sent a weak/list form — got a 200 instead of a 304.
  it('emits a quoted, strong ETag (F-10)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    expect(res.headers.etag).toBe(`"${res.body.version}"`);
  });

  it('304 for quoted, weak and list forms of the same validator (F-10)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    const version: string = res.body.version;

    for (const header of [
      `"${version}"`, // exactly what the server sends
      `W/"${version}"`, // weak validator
      `"other", "${version}"`, // list
      '*', // any
    ]) {
      await request(app.getHttpServer())
        .get('/v1/catalog')
        .set('If-None-Match', header)
        .expect(304);
    }
  });

  // QA F-05 support: the mobile client verifies this hash over the exact bytes
  // it received, so it must be the SHA-256 of the JSON body the server sends.
  it('sends X-Catalog-Payload-Sha256 over the response body (F-05)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/catalog').expect(200);
    const header = res.headers['x-catalog-payload-sha256'];
    expect(typeof header).toBe('string');
    const digest = createHash('sha256').update(res.text, 'utf8').digest('hex');
    expect(header).toBe(digest);
  });
});
