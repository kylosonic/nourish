import { Inject, Injectable } from '@nestjs/common';
import { ConsentKind, Entitlement, OtpChallenge, Plan, RefreshToken, User } from '@prisma/client';
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
    return { granted: row?.grantedAt != null && row.revokedAt == null, version: row?.version ?? null };
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { ...input } });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
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
