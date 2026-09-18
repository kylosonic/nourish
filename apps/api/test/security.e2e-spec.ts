/**
 * Security e2e (A8/A10, SAFE-02): 429 burst + healthz exemption, CORS
 * allowlist, helmet headers, error envelope, sanitized 5xx.
 */
import { setTestEnv, truncateAll, fixtureBytes } from './db-utils';

setTestEnv();

import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { NourishConfigModule } from '../src/config/config.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { HealthModule } from '../src/health/health.module';
import { FoodsModule } from '../src/foods/foods.module';
import { ImportsModule } from '../src/imports/imports.module';
import { configureApp } from '../src/app.setup';
import { EnvVars } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
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

/**
 * Build an app with a deterministic throttler budget. ConfigModule validates
 * env at import time, so a runtime env override would lose to the .env value;
 * an explicit ThrottlerModule keeps each test's budget independent.
 */
async function makeApp(limit: number): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      NourishConfigModule,
      ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit }] }),
      PrismaModule,
      HealthModule,
      FoodsModule,
      ImportsModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  }).compile();
  const created = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(created, created.get(ConfigService<EnvVars, true>));
  await created.init();
  return created;
}

beforeAll(async () => {
  app = await makeApp(1000);
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

describe('rate limiting (A8)', () => {
  it('bursts over the limit → 429 RATE_LIMITED envelope; healthz stays exempt', async () => {
    // Dedicated low-budget app so the burst does not poison other tests.
    const limitedApp = await makeApp(5);
    try {
      const server = limitedApp.getHttpServer();
      let limited = false;
      for (let i = 0; i < 8; i++) {
        const res = await request(server).get('/v1/foods').query({ limit: 1 });
        if (res.status === 429) {
          limited = true;
          expect(res.body.error.code).toBe('RATE_LIMITED');
          expect(res.body.error.requestId).toEqual(expect.any(String));
          break;
        }
      }
      expect(limited).toBe(true);

      // healthz is exempt even when the budget is exhausted.
      const health = await request(server).get('/v1/healthz').expect(200);
      expect(health.body.db).toBe('up');
    } finally {
      await limitedApp.close();
    }
  });
});

describe('CORS (A10)', () => {
  it('allows configured origins and echoes the header', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rejects non-allowlisted origins (no ACAO header)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .set('Origin', 'https://evil.example')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('OPTIONS preflight succeeds with allow headers', async () => {
    const res = await request(app.getHttpServer())
      .options('/v1/foods')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
  });
});

describe('helmet (A10)', () => {
  it('sets security headers on every response', async () => {
    const res = await request(app.getHttpServer()).get('/v1/healthz').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toEqual(expect.any(String));
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
});

describe('error envelope', () => {
  it('404 → FOOD_NOT_FOUND envelope with request id echo', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods/nope').expect(404);
    expect(res.body.error.code).toBe('FOOD_NOT_FOUND');
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });

  it('400 → VALIDATION_ERROR envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/foods').query({ limit: -3 }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // QA F-09: `page` was unbounded, so `(page - 1) * limit` could be driven to an
  // arbitrary OFFSET. It now has an explicit upper bound.
  it('400 → an out-of-range page is rejected (F-09)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ page: 99999999999 })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('page');
  });
});

// QA F-08: Prisma's `contains` builds a `%value%` LIKE pattern without escaping,
// so a query of "%" or "_" behaved as a wildcard and returned the whole catalog.
describe('search input is matched literally (F-08)', () => {
  it('q="%" returns no food rather than the whole catalog', async () => {
    const all = await request(app.getHttpServer()).get('/v1/foods').expect(200);
    expect(all.body.meta.total).toBeGreaterThan(0);

    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: '%' })
      .expect(200);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it('q="_" returns no food', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: '_' })
      .expect(200);
    expect(res.body.meta.total).toBe(0);
  });

  it('a literal query still matches (escaping did not break search)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/foods')
      .query({ q: 'doro' })
      .expect(200);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });
});

describe('http exception filter (5xx sanitization)', () => {
  it('sanitizes internal errors: no internals leak into the envelope', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn();
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json,
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('secret stack trace / SQL detail'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL', message: 'Internal server error', requestId: expect.any(String) },
    });
    const payload = json.mock.calls[0][0] as { error: { message: string } };
    expect(payload.error.message).not.toContain('secret');
  });
});
