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

interface Account {
  token: string;
  id: string;
}

describe('couples, cycle sharing and streaks', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let owner: Account;
  let partner: Account;

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
    owner = await register('owner@example.com', 'Cycle Owner');
    partner = await register('partner@example.com', 'Care Partner');
  });

  async function register(email: string, displayName: string): Promise<Account> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/email/register')
      .send({
        email,
        password: 'correct-horse-battery',
        displayName,
      })
      .expect(201);
    return {
      token: response.body.tokens.accessToken,
      id: response.body.account.id,
    };
  }

  const auth = (account: Account): { Authorization: string } => ({
    Authorization: `Bearer ${account.token}`,
  });

  async function pair(): Promise<void> {
    const invitation = await request(app.getHttpServer())
      .post('/v1/couples/invitations')
      .set(auth(owner))
      .expect(201);
    expect(invitation.body.code).toMatch(/^[A-Z2-9]{8}$/);

    await request(app.getHttpServer())
      .post('/v1/couples/join')
      .set(auth(partner))
      .send({ code: invitation.body.code.toLowerCase() })
      .expect(200);
  }

  it('requires authentication for private couple data', async () => {
    await request(app.getHttpServer()).get('/v1/couples').expect(401);
    await request(app.getHttpServer()).post('/v1/couples/invitations').expect(401);
  });

  it('pairs with a single-use code and leaves every sharing category off', async () => {
    await pair();
    const state = await request(app.getHttpServer())
      .get('/v1/couples')
      .set(auth(partner))
      .expect(200);
    expect(state.body.connection.partnerName).toBe('Cycle Owner');
    expect(state.body.connection.mySharing).toEqual({
      shareCycle: false,
      shareCheckIns: false,
      shareFoodStreak: false,
    });
    expect(state.body.connection.partnerView.cycleStartDateKeys).toEqual([]);
    expect(state.body.connection.partnerView.checkInDateKeys).toEqual([]);
  });

  it('keeps cycle symptoms private and revokes the partner view immediately', async () => {
    await pair();
    await request(app.getHttpServer())
      .post('/v1/sync')
      .set(auth(owner))
      .send({
        operations: [
          {
            kind: 'cycleProfile',
            op: 'upsert',
            clientId: 'cycle-profile',
            updatedAt: '2026-10-29T09:00:00.000Z',
            cycleLengthDays: 29,
            periodLengthDays: 5,
          },
          {
            kind: 'cycle',
            op: 'upsert',
            clientId: 'cycle-1',
            clientSeq: 1,
            updatedAt: '2026-10-29T09:01:00.000Z',
            startDateKey: '2026-10-01',
            endDateKey: '2026-10-05',
            symptoms: ['cramps', 'fatigue'],
          },
        ],
      })
      .expect(200);

    let state = await request(app.getHttpServer())
      .get('/v1/couples')
      .set(auth(partner))
      .expect(200);
    expect(state.body.connection.partnerView.cycleStartDateKeys).toEqual([]);

    await request(app.getHttpServer())
      .patch('/v1/couples/sharing')
      .set(auth(owner))
      .send({ shareCycle: true })
      .expect(200);
    state = await request(app.getHttpServer())
      .get('/v1/couples')
      .set(auth(partner))
      .expect(200);
    expect(state.body.connection.partnerView.cycleStartDateKeys).toEqual([
      '2026-10-01',
    ]);
    expect(state.body.connection.partnerView.cycleLengthDays).toBe(29);
    expect(JSON.stringify(state.body)).not.toContain('cramps');

    await request(app.getHttpServer())
      .patch('/v1/couples/sharing')
      .set(auth(owner))
      .send({ shareCycle: false })
      .expect(200);
    state = await request(app.getHttpServer())
      .get('/v1/couples')
      .set(auth(partner))
      .expect(200);
    expect(state.body.connection.partnerView.cycleStartDateKeys).toEqual([]);
    expect(state.body.connection.partnerView.cycleLengthDays).toBeNull();
  });

  it('shares check-in dates only after both people explicitly opt in', async () => {
    await pair();
    for (const account of [owner, partner]) {
      await request(app.getHttpServer())
        .post('/v1/sync')
        .set(auth(account))
        .send({
          operations: [
            {
              kind: 'checkIn',
              op: 'upsert',
              clientId: 'checkin-2026-10-29',
              clientSeq: 1,
              updatedAt: '2026-10-29T12:00:00.000Z',
              dateKey: '2026-10-29',
            },
          ],
        })
        .expect(200);
    }

    await request(app.getHttpServer())
      .patch('/v1/couples/sharing')
      .set(auth(owner))
      .send({ shareCheckIns: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch('/v1/couples/sharing')
      .set(auth(partner))
      .send({ shareCheckIns: true })
      .expect(200);

    const state = await request(app.getHttpServer())
      .get('/v1/couples')
      .set(auth(owner))
      .expect(200);
    expect(state.body.connection.partnerView.checkInDateKeys).toEqual([
      '2026-10-29',
    ]);
    expect(state.body.connection.partnerSharing.shareCheckIns).toBe(true);
  });
});
