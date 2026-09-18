/**
 * S3 sync e2e (OFF-02): a device queues offline work, the connection returns,
 * and the mirror converges — in order, idempotently, with deletes as tombstones
 * and per-operation rejections instead of a silently dropped batch.
 */
import { setTestEnv, truncateAll } from './db-utils';

setTestEnv();

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { EnvVars } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { SMS_PROVIDER } from '../src/auth/auth.tokens';
import { SmsMessage, SmsProvider } from '../src/auth/sms-provider';

class CapturingSmsProvider implements SmsProvider {
  readonly name = 'capturing';
  readonly sent: SmsMessage[] = [];

  send(message: SmsMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  lastCode(): string {
    const match = /(\d{6})/.exec(this.sent[this.sent.length - 1]?.body ?? '');
    if (!match) throw new Error('no code was sent');
    return match[1];
  }
}

const PHONE = '0911234567';

describe('S3 sync (OFF-02, ADR-0008)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let sms: CapturingSmsProvider;
  let token: string;

  beforeAll(async () => {
    sms = new CapturingSmsProvider();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SMS_PROVIDER)
      .useValue(sms)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app, app.get(ConfigService<EnvVars, true>));
    await app.init();
    prisma = app.get(PrismaService);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    sms.sent.length = 0;
    await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: PHONE }).expect(202);
    const verified = await request(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({ phone: PHONE, code: sms.lastCode() })
      .expect(200);
    token = verified.body.tokens.accessToken;
  });

  const auth = (): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

  function mealOp(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      kind: 'meal',
      op: 'upsert',
      clientId: 'meal-1',
      clientSeq: 1,
      updatedAt: '2026-09-19T10:00:00.000Z',
      loggedAt: '2026-09-19T09:30:00.000Z',
      dateKey: '2026-09-19',
      slot: 'lunch',
      items: [
        {
          clientId: 'item-1',
          foodId: 'shiro_wot',
          foodName: 'Shiro Wot',
          portionUnit: 'cup',
          portionQuantity: 1,
          grams: 240,
          kcal: 350,
          proteinG: 8,
          carbsG: 16,
          fatG: 27,
          fiberG: 4.3,
          sodiumMg: 1613,
        },
      ],
      ...overrides,
    };
  }

  it('requires a session', async () => {
    await request(app.getHttpServer()).post('/v1/sync').send({ operations: [] }).expect(401);
    await request(app.getHttpServer()).get('/v1/sync/changes').expect(401);
  });

  it('applies three queued water logs in the order they were recorded', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          {
            kind: 'water',
            op: 'upsert',
            clientId: 'w-1',
            updatedAt: '2026-09-19T08:00:00.000Z',
            dateKey: '2026-09-19',
            amountMl: 250,
          },
          {
            kind: 'water',
            op: 'upsert',
            clientId: 'w-2',
            updatedAt: '2026-09-19T09:00:00.000Z',
            dateKey: '2026-09-19',
            amountMl: 250,
          },
          {
            kind: 'water',
            op: 'upsert',
            clientId: 'w-3',
            updatedAt: '2026-09-19T10:00:00.000Z',
            dateKey: '2026-09-19',
            amountMl: 500,
          },
        ],
      })
      .expect(200);

    expect(res.body.applied).toHaveLength(3);
    expect(res.body.rejected).toHaveLength(0);
    expect(res.body.applied.every((a: { outcome: string }) => a.outcome === 'applied')).toBe(true);

    const stored = await prisma.waterLog.findMany({ orderBy: { updatedAt: 'asc' } });
    expect(stored.map((row) => row.clientId)).toEqual(['w-1', 'w-2', 'w-3']);
    expect(stored.map((row) => row.amountMl)).toEqual([250, 250, 500]);
    expect(stored.reduce((sum, row) => sum + row.amountMl, 0)).toBe(1000);
  });

  it('mirrors a meal with its nutrition snapshot and is idempotent on replay', async () => {
    const first = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({ operations: [mealOp()] })
      .expect(200);
    expect(first.body.applied[0].outcome).toBe('applied');

    const replayed = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({ operations: [mealOp()] })
      .expect(200);
    // Replaying the same queue entry changes nothing.
    expect(replayed.body.applied[0].outcome).toBe('unchanged');
    expect(await prisma.meal.count()).toBe(1);
    expect(await prisma.mealItem.count()).toBe(1);

    const item = await prisma.mealItem.findFirstOrThrow();
    expect(item.foodId).toBe('shiro_wot');
    expect(item.kcal).toBe(350);
    expect(item.grams).toBe(240);
  });

  it('resolves a conflict with the latest write per item', async () => {
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({ operations: [mealOp()] })
      .expect(200);

    // A newer edit from the same device…
    const newer = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          mealOp({
            clientSeq: 2,
            updatedAt: '2026-09-19T11:00:00.000Z',
            items: [
              {
                clientId: 'item-1',
                foodId: 'shiro_wot',
                foodName: 'Shiro Wot',
                portionUnit: 'cup',
                portionQuantity: 2,
                grams: 480,
                kcal: 700,
                proteinG: 16,
                carbsG: 32,
                fatG: 54,
              },
            ],
          }),
        ],
      })
      .expect(200);
    expect(newer.body.applied[0].outcome).toBe('applied');

    // …then a stale write from a second device that was offline longer.
    const stale = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          mealOp({
            clientSeq: 1,
            updatedAt: '2026-09-19T09:00:00.000Z',
            items: [
              {
                clientId: 'item-1',
                foodId: 'shiro_wot',
                foodName: 'Shiro Wot',
                portionUnit: 'cup',
                portionQuantity: 1,
                grams: 240,
                kcal: 350,
                proteinG: 8,
                carbsG: 16,
                fatG: 27,
              },
            ],
          }),
        ],
      })
      .expect(200);
    expect(stale.body.applied[0].outcome).toBe('ignored-stale');

    // The newer version is authoritative, and the stale edit did not add items.
    const items = await prisma.mealItem.findMany();
    expect(items).toHaveLength(1);
    expect(items[0].grams).toBe(480);
    expect(items[0].kcal).toBe(700);
  });

  it('edits replace items, and a delete is a tombstone rather than a hard delete', async () => {
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          mealOp({
            items: [
              {
                clientId: 'item-1',
                foodId: 'shiro_wot',
                foodName: 'Shiro Wot',
                portionUnit: 'cup',
                portionQuantity: 1,
                grams: 240,
                kcal: 350,
                proteinG: 8,
                carbsG: 16,
                fatG: 27,
              },
              {
                clientId: 'item-2',
                foodId: 'injera',
                foodName: 'Injera',
                portionUnit: 'injera',
                portionQuantity: 1,
                grams: 150,
                kcal: 228,
                proteinG: 6,
                carbsG: 44,
                fatG: 2,
              },
            ],
          }),
        ],
      })
      .expect(200);
    expect(await prisma.mealItem.count()).toBe(2);

    // Removing an item must remove it server-side too.
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          mealOp({
            clientSeq: 2,
            updatedAt: '2026-09-19T12:00:00.000Z',
            items: [
              {
                clientId: 'item-1',
                foodId: 'shiro_wot',
                foodName: 'Shiro Wot',
                portionUnit: 'cup',
                portionQuantity: 1,
                grams: 240,
                kcal: 350,
                proteinG: 8,
                carbsG: 16,
                fatG: 27,
              },
            ],
          }),
        ],
      })
      .expect(200);
    expect(await prisma.mealItem.count()).toBe(1);

    // Deleting the meal keeps the row so other devices learn about it.
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          { kind: 'meal', op: 'delete', clientId: 'meal-1', clientSeq: 3, updatedAt: '2026-09-19T13:00:00.000Z' },
        ],
      })
      .expect(200);

    const meal = await prisma.meal.findFirstOrThrow();
    expect(meal.deletedAt).not.toBeNull();

    // …and the pull returns the tombstone rather than hiding it.
    const changes = await request(app.getHttpServer())
      .get('/v1/sync/changes')
      .set(auth())
      .expect(200);
    expect(changes.body.meals).toHaveLength(1);
    expect(changes.body.meals[0].deletedAt).not.toBeNull();
  });

  it('rejects a bad operation individually and still applies the rest', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          {
            kind: 'water',
            op: 'upsert',
            clientId: 'w-1',
            updatedAt: '2026-09-19T08:00:00.000Z',
            dateKey: '2026-09-19',
            amountMl: 250,
          },
          // A meal with no items is not a meal: rejected with a reason…
          mealOp({ clientId: 'meal-broken', items: [] }),
          {
            kind: 'weight',
            op: 'upsert',
            clientId: 'g-1',
            updatedAt: '2026-09-19T08:05:00.000Z',
            dateKey: '2026-09-19',
            weightKg: 71.4,
          },
        ],
      })
      .expect(200);

    expect(res.body.applied).toHaveLength(2);
    expect(res.body.rejected).toHaveLength(1);
    expect(res.body.rejected[0].clientId).toBe('meal-broken');
    expect(res.body.rejected[0].reason).toMatch(/at least one item/);

    // The rest of the queue still landed — no silent loss of offline work.
    expect(await prisma.waterLog.count()).toBe(1);
    expect(await prisma.weightLog.count()).toBe(1);
    expect(await prisma.meal.count()).toBe(0);
  });

  it('the pull returns only what changed after the cursor', async () => {
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          {
            kind: 'weight',
            op: 'upsert',
            clientId: 'g-1',
            updatedAt: '2026-09-19T08:00:00.000Z',
            dateKey: '2026-09-18',
            weightKg: 72,
          },
        ],
      })
      .expect(200);

    const cursor = new Date('2026-09-19T09:00:00.000Z').toISOString();
    const none = await request(app.getHttpServer())
      .get('/v1/sync/changes')
      .query({ since: cursor })
      .set(auth())
      .expect(200);
    expect(none.body.weight).toHaveLength(0);

    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          {
            kind: 'weight',
            op: 'upsert',
            clientId: 'g-2',
            updatedAt: '2026-09-19T10:00:00.000Z',
            dateKey: '2026-09-19',
            weightKg: 71.4,
          },
        ],
      })
      .expect(200);

    const after = await request(app.getHttpServer())
      .get('/v1/sync/changes')
      .query({ since: cursor })
      .set(auth())
      .expect(200);
    expect(after.body.weight).toHaveLength(1);
    expect(after.body.weight[0].weightKg).toBe(71.4);

    // A device with no cursor gets everything it has never seen.
    const all = await request(app.getHttpServer())
      .get('/v1/sync/changes')
      .set(auth())
      .expect(200);
    expect(all.body.weight).toHaveLength(2);
  });

  it('keeps one account’s log away from another account', async () => {
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({
        operations: [
          {
            kind: 'water',
            op: 'upsert',
            clientId: 'w-1',
            updatedAt: '2026-09-19T08:00:00.000Z',
            dateKey: '2026-09-19',
            amountMl: 250,
          },
        ],
      })
      .expect(200);

    // A second account, signed in from another number.
    await prisma.otpChallenge.updateMany({ data: { createdAt: new Date(Date.now() - 600000) } });
    await request(app.getHttpServer()).post('/v1/auth/otp').send({ phone: '0911222333' }).expect(202);
    const other = await request(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({ phone: '0911222333', code: sms.lastCode() })
      .expect(200);

    const theirs = await request(app.getHttpServer())
      .get('/v1/sync/changes')
      .set({ Authorization: `Bearer ${other.body.tokens.accessToken}` })
      .expect(200);
    expect(theirs.body.water).toHaveLength(0);
    expect(theirs.body.meals).toHaveLength(0);
  });

  it('rejects an operation the schema cannot accept', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth())
      .send({ operations: [{ kind: 'telepathy', op: 'upsert', clientId: 'x', updatedAt: '2026-09-19T08:00:00.000Z' }] })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
