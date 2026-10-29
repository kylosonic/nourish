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

describe('account consent and deletion', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
    const registered = await request(app.getHttpServer())
      .post('/v1/auth/email/register')
      .send({
        email: 'delete-me@example.com',
        password: 'correct-horse-battery',
        displayName: 'Delete Me',
      })
      .expect(201);
    token = registered.body.tokens.accessToken as string;
    userId = registered.body.account.id as string;
  });

  it('reads and updates every privacy consent with an audit timestamp', async () => {
    const initial = await request(app.getHttpServer())
      .get('/v1/account/consent')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(initial.body.version).toBe('2026-10-29');
    expect(initial.body.healthDataProcessing.granted).toBe(false);
    expect(initial.body.aiImprovement.granted).toBe(false);
    expect(initial.body.analytics.granted).toBe(false);

    const updated = await request(app.getHttpServer())
      .patch('/v1/account/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({
        healthDataProcessing: true,
        aiImprovement: true,
        analytics: false,
      })
      .expect(200);
    expect(updated.body.healthDataProcessing.granted).toBe(true);
    expect(updated.body.aiImprovement.granted).toBe(true);
    expect(updated.body.analytics.granted).toBe(false);
    expect(updated.body.aiImprovement.updatedAt).toEqual(expect.any(String));

    const rows = await prisma.consent.findMany({ where: { userId } });
    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.kind === 'aiImprovement')?.granted).toBe(true);
    expect(rows.find((row) => row.kind === 'analytics')?.revokedAt).not.toBeNull();
  });

  it('rejects an empty consent patch', async () => {
    const result = await request(app.getHttpServer())
      .patch('/v1/account/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
    expect(result.body.error.code).toBe('CONSENT_UPDATE_EMPTY');
  });

  it('hard-deletes the account, health mirror, sessions, consent and analysis metadata', async () => {
    await prisma.meal.create({
      data: {
        userId,
        clientId: 'meal-delete-test',
        dateKey: '2026-10-29',
        slot: 'lunch',
        loggedAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: {
            clientId: 'item-delete-test',
            foodId: 'injera',
            foodName: 'Injera',
            portionUnit: 'injera',
            portionQuantity: 1,
            grams: 150,
            kcal: 225,
            proteinG: 7.5,
            carbsG: 45,
            fatG: 1.5,
          },
        },
      },
    });
    await prisma.waterLog.create({
      data: {
        userId,
        clientId: 'water-delete-test',
        dateKey: '2026-10-29',
        amountMl: 250,
        loggedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.weightLog.create({
      data: {
        userId,
        clientId: 'weight-delete-test',
        dateKey: '2026-10-29',
        weightKg: 67.4,
        loggedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.consent.create({
      data: {
        userId,
        kind: 'aiImprovement',
        version: '2026-10-29',
        granted: true,
        grantedAt: new Date(),
      },
    });
    await prisma.analysisRun.create({
      data: {
        status: 'Completed',
        inputKind: 'Text',
        overallConfidence: 1,
        confidenceState: 'High',
        modelVersion: 'test',
        promptVersion: 'test',
        userId,
      },
    });

    await request(app.getHttpServer())
      .delete('/v1/account')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await prisma.user.count({ where: { id: userId } })).toBe(0);
    expect(await prisma.meal.count({ where: { userId } })).toBe(0);
    expect(await prisma.waterLog.count({ where: { userId } })).toBe(0);
    expect(await prisma.weightLog.count({ where: { userId } })).toBe(0);
    expect(await prisma.consent.count({ where: { userId } })).toBe(0);
    expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);
    expect(await prisma.analysisRun.count({ where: { userId } })).toBe(0);

    await request(app.getHttpServer())
      .get('/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
