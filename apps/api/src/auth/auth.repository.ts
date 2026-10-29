import { Inject, Injectable } from '@nestjs/common';
import {
  ConsentKind,
  EmailOtpChallenge,
  Entitlement,
  OtpChallenge,
  Plan,
  RefreshToken,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateChallengeInput {
  phoneE164: string;
  codeHash: string;
  codeSalt: string;
  maxAttempts: number;
  expiresAt: Date;
}

export interface CreateRefreshTokenInput {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
}

export interface CreateEmailChallengeInput {
  email: string;
  codeHash: string;
  codeSalt: string;
  maxAttempts: number;
  expiresAt: Date;
}

/**
 * Persistence for accounts and sessions. Every write is a parameterized Prisma
 * call; the sign-in path (consume the challenge, create the user if needed,
 * issue the session) runs in one transaction so a failure cannot leave a
 * consumed code without a session.
 */
@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ── OTP ───────────────────────────────────────────────────────────────────

  /** The newest challenge that has neither been used nor superseded. */
  async findActiveChallenge(phoneE164: string): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: { phoneE164, consumedAt: null, invalidatedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The most recent challenge regardless of state — used for the resend gap. */
  async findLatestChallenge(phoneE164: string): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: { phoneE164 },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChallenge(input: CreateChallengeInput): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.create({ data: { ...input } });
  }

  /** Supersede every outstanding code for this number (AUTH-02: resend wins). */
  async invalidateOutstanding(phoneE164: string, at: Date): Promise<number> {
    const result = await this.prisma.otpChallenge.updateMany({
      where: { phoneE164, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: at },
    });
    return result.count;
  }

  async registerFailedAttempt(challengeId: string): Promise<number> {
    const updated = await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } },
    });
    return updated.attempts;
  }

  async consumeChallenge(challengeId: string, at: Date): Promise<void> {
    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { consumedAt: at },
    });
  }

  /**
   * Housekeeping for expired codes. A code's hash has no value after its
   * validity window, so the rows are removed rather than kept.
   */
  async purgeExpiredChallenges(before: Date): Promise<number> {
    const result = await this.prisma.otpChallenge.deleteMany({
      where: { expiresAt: { lt: before } },
    });
    return result.count;
  }

  /** Count only — used by the purge CLI's dry run, which deletes nothing. */
  async countExpiredChallenges(before: Date): Promise<number> {
    return this.prisma.otpChallenge.count({ where: { expiresAt: { lt: before } } });
  }

  // ── Email OTP fallback ───────────────────────────────────────────────────

  async findActiveEmailChallenge(email: string): Promise<EmailOtpChallenge | null> {
    return this.prisma.emailOtpChallenge.findFirst({
      where: { email, consumedAt: null, invalidatedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestEmailChallenge(email: string): Promise<EmailOtpChallenge | null> {
    return this.prisma.emailOtpChallenge.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailChallenge(
    input: CreateEmailChallengeInput,
  ): Promise<EmailOtpChallenge> {
    return this.prisma.emailOtpChallenge.create({ data: input });
  }

  async invalidateOutstandingEmail(email: string, at: Date): Promise<number> {
    const result = await this.prisma.emailOtpChallenge.updateMany({
      where: { email, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: at },
    });
    return result.count;
  }

  async registerFailedEmailAttempt(challengeId: string): Promise<number> {
    const updated = await this.prisma.emailOtpChallenge.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } },
    });
    return updated.attempts;
  }

  async consumeEmailChallenge(challengeId: string, at: Date): Promise<void> {
    await this.prisma.emailOtpChallenge.update({
      where: { id: challengeId },
      data: { consumedAt: at },
    });
  }

  // ── Users, consent, entitlement ───────────────────────────────────────────

  /**
   * Find or create the account for a verified number, and make sure it has an
   * entitlement row. A number with no account follows the sign-up path rather
   * than erroring (AUTH-02 edge case).
   */
  async upsertUserForPhone(phoneE164: string): Promise<{ user: User; created: boolean }> {
    const existing = await this.prisma.user.findUnique({ where: { phoneE164 } });
    if (existing) {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });
      await this.ensureEntitlement(user.id);
      return { user, created: false };
    }
    const user = await this.prisma.user.create({
      data: { phoneE164, lastSeenAt: new Date() },
    });
    await this.ensureEntitlement(user.id);
    return { user, created: true };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserByGoogleSubject(googleSubject: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleSubject } });
  }

  async createEmailUser(input: {
    email: string;
    passwordHash: string;
    displayName: string | null;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        lastSeenAt: new Date(),
      },
    });
    await this.ensureEntitlement(user.id);
    return user;
  }

  /** Email OTP can create a passwordless account and later link other methods. */
  async upsertUserForEmail(email: string): Promise<{ user: User; created: boolean }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });
      await this.ensureEntitlement(user.id);
      return { user, created: false };
    }
    const user = await this.prisma.user.create({
      data: { email, lastSeenAt: new Date() },
    });
    await this.ensureEntitlement(user.id);
    return { user, created: true };
  }

  /**
   * Google `sub` is the identity key. If an email/password account already
   * owns the verified email, link Google to that account rather than creating
   * a duplicate.
   */
  async upsertGoogleUser(input: {
    subject: string;
    email: string;
    displayName: string | null;
  }): Promise<{ user: User; created: boolean }> {
    const bySubject = await this.findUserByGoogleSubject(input.subject);
    if (bySubject) {
      const user = await this.prisma.user.update({
        where: { id: bySubject.id },
        data: {
          lastSeenAt: new Date(),
          displayName: bySubject.displayName ?? input.displayName,
        },
      });
      await this.ensureEntitlement(user.id);
      return { user, created: false };
    }

    const byEmail = await this.findUserByEmail(input.email);
    if (byEmail) {
      const user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleSubject: input.subject,
          lastSeenAt: new Date(),
          displayName: byEmail.displayName ?? input.displayName,
        },
      });
      await this.ensureEntitlement(user.id);
      return { user, created: false };
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        googleSubject: input.subject,
        displayName: input.displayName,
        lastSeenAt: new Date(),
      },
    });
    await this.ensureEntitlement(user.id);
    return { user, created: true };
  }

  async touchUser(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  /** Default entitlement is FREE and server-owned (SUB-01). */
  async ensureEntitlement(userId: string): Promise<Entitlement> {
    return this.prisma.entitlement.upsert({
      where: { userId },
      create: { userId, plan: Plan.FREE, source: 'default' },
      update: {},
    });
  }

  async consentFor(userId: string, kind: ConsentKind): Promise<{ granted: boolean; version: string | null }> {
    const row = await this.prisma.consent.findFirst({
      where: { userId, kind },
      orderBy: { updatedAt: 'desc' },
    });
    // Absence of a grant is the default: AI improvement is off unless the user
    // explicitly turned it on (SAFE-06).
    return { granted: row?.granted ?? false, version: row?.version ?? null };
  }

  async consentsFor(userId: string): Promise<Map<ConsentKind, {
    granted: boolean;
    updatedAt: Date;
  }>> {
    const rows = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    const result = new Map<ConsentKind, { granted: boolean; updatedAt: Date }>();
    for (const row of rows) {
      if (!result.has(row.kind)) {
        result.set(row.kind, { granted: row.granted, updatedAt: row.updatedAt });
      }
    }
    return result;
  }

  async updateConsents(
    userId: string,
    updates: { kind: ConsentKind; granted: boolean }[],
    version: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const update of updates) {
        const existing = await tx.consent.findUnique({
          where: {
            userId_kind_version: {
              userId,
              kind: update.kind,
              version,
            },
          },
        });
        if (!existing) {
          await tx.consent.create({
            data: {
              userId,
              kind: update.kind,
              version,
              granted: update.granted,
              grantedAt: update.granted ? now : null,
              revokedAt: update.granted ? null : now,
            },
          });
          continue;
        }
        await tx.consent.update({
          where: { id: existing.id },
          data: {
            granted: update.granted,
            grantedAt:
              update.granted && existing.grantedAt == null
                ? now
                : existing.grantedAt,
            revokedAt: update.granted ? null : now,
          },
        });
      }
    });
  }

  /**
   * Hard-delete the account and everything owned by it. Most child rows cascade
   * from User; anonymous analysis runs and pre-account OTP rows are keyed
   * separately, so they are removed explicitly in the same transaction.
   */
  async deleteAccount(userId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) return false;
      await tx.analysisRun.deleteMany({ where: { userId } });
      if (user.phoneE164) {
        await tx.otpChallenge.deleteMany({
          where: { phoneE164: user.phoneE164 },
        });
      }
      if (user.email) {
        await tx.emailOtpChallenge.deleteMany({
          where: { email: user.email },
        });
      }
      await tx.user.delete({ where: { id: userId } });
      return true;
    });
  }

  async createDeletionRequest(input: {
    email?: string;
    phoneE164?: string;
    note?: string;
  }): Promise<{ id: string; createdAt: Date }> {
    return this.prisma.accountDeletionRequest.create({
      data: input,
      select: { id: true, createdAt: true },
    });
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { ...input } });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async findSessionById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  /** Rotation: the presented token is retired in favour of its successor. */
  async rotateRefreshToken(currentId: string, successorId: string, at: Date): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: currentId },
      data: { revokedAt: at, replacedById: successorId },
    });
  }

  /**
   * Reuse detection response: revoke the whole chain for that device. Other
   * devices' families are untouched (AUTH-03 edge case).
   */
  async revokeFamily(familyId: string, at: Date): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: at },
    });
    return result.count;
  }

  async countActiveSessions(userId: string): Promise<number> {
    return this.prisma.refreshToken.count({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }
}
