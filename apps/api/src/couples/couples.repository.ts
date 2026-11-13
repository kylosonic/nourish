import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCoupleSharingDto } from './dto/couples.dto';

export type JoinOutcome = 'joined' | 'invalid' | 'paired' | 'self';

export interface ActiveConnection {
  id: string;
  userOneId: string;
  userTwoId: string;
  createdAt: Date;
  userOne: { displayName: string | null };
  userTwo: { displayName: string | null };
  preferences: {
    id: string;
    userId: string;
    shareCycle: boolean;
    shareCheckIns: boolean;
    shareFoodStreak: boolean;
  }[];
}

@Injectable()
export class CouplesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findInvitationHash(codeHash: string): Promise<{ id: string } | null> {
    return this.prisma.coupleInvitation.findUnique({
      where: { codeHash },
      select: { id: true },
    });
  }

  async findActiveConnection(userId: string): Promise<ActiveConnection | null> {
    return this.prisma.coupleConnection.findFirst({
      where: {
        endedAt: null,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        userOne: { select: { displayName: true } },
        userTwo: { select: { displayName: true } },
        preferences: {
          select: {
            id: true,
            userId: true,
            shareCycle: true,
            shareCheckIns: true,
            shareFoodStreak: true,
          },
        },
      },
    });
  }

  async createInvitation(input: {
    inviterId: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.coupleInvitation.updateMany({
        where: {
          inviterId: input.inviterId,
          consumedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      await tx.coupleInvitation.create({ data: input });
    });
  }

  async joinInvitation(
    userId: string,
    codeHash: string,
    now: Date,
  ): Promise<JoinOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.coupleInvitation.findUnique({
        where: { codeHash },
      });
      if (
        !invitation ||
        invitation.consumedAt ||
        invitation.revokedAt ||
        invitation.expiresAt <= now
      ) {
        return 'invalid';
      }
      if (invitation.inviterId === userId) return 'self';

      const existing = await tx.coupleConnection.findFirst({
        where: {
          endedAt: null,
          OR: [{ userOneId: userId }, { userTwoId: userId }],
        },
        select: { id: true },
      });
      const inviterPaired = await tx.coupleConnection.findFirst({
        where: {
          endedAt: null,
          OR: [
            { userOneId: invitation.inviterId },
            { userTwoId: invitation.inviterId },
          ],
        },
        select: { id: true },
      });
      if (existing || inviterPaired) return 'paired';

      const consumed = await tx.coupleInvitation.updateMany({
        where: {
          id: invitation.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return 'invalid';

      const connection = await tx.coupleConnection.create({
        data: {
          userOneId: invitation.inviterId,
          userTwoId: userId,
        },
      });
      await tx.coupleSharingPreference.createMany({
        data: [
          {
            userId: invitation.inviterId,
            coupleId: connection.id,
            updatedAt: now,
          },
          { userId, coupleId: connection.id, updatedAt: now },
        ],
      });
      return 'joined';
    });
  }

  async updateSharing(
    userId: string,
    connectionId: string,
    patch: UpdateCoupleSharingDto,
  ): Promise<boolean> {
    const connection = await this.prisma.coupleConnection.findFirst({
      where: {
        id: connectionId,
        endedAt: null,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: { id: true },
    });
    if (!connection) return false;

    await this.prisma.coupleSharingPreference.upsert({
      where: { userId_coupleId: { userId, coupleId: connectionId } },
      create: {
        userId,
        coupleId: connectionId,
        shareCycle: patch.shareCycle ?? false,
        shareCheckIns: patch.shareCheckIns ?? false,
        shareFoodStreak: patch.shareFoodStreak ?? false,
      },
      update: {
        ...(patch.shareCycle == null ? {} : { shareCycle: patch.shareCycle }),
        ...(patch.shareCheckIns == null
          ? {}
          : { shareCheckIns: patch.shareCheckIns }),
        ...(patch.shareFoodStreak == null
          ? {}
          : { shareFoodStreak: patch.shareFoodStreak }),
      },
    });
    return true;
  }

  async endConnection(userId: string, now: Date): Promise<boolean> {
    const connection = await this.findActiveConnection(userId);
    if (!connection) return false;
    await this.prisma.$transaction([
      this.prisma.coupleSharingPreference.deleteMany({
        where: { coupleId: connection.id },
      }),
      this.prisma.coupleConnection.update({
        where: { id: connection.id },
        data: { endedAt: now },
      }),
    ]);
    return true;
  }

  async partnerData(partnerId: string, shares: {
    shareCycle: boolean;
    shareCheckIns: boolean;
    shareFoodStreak: boolean;
  }): Promise<{
    cycleStartDateKeys: string[];
    cycleLengthDays: number | null;
    periodLengthDays: number | null;
    checkInDateKeys: string[];
    foodLogDateKeys: string[];
  }> {
    const cycles = shares.shareCycle
      ? await this.prisma.cycleEntry.findMany({
          where: { userId: partnerId, deletedAt: null },
          orderBy: { startDateKey: 'desc' },
          take: 24,
          select: { startDateKey: true },
        })
      : [];
    const profile = shares.shareCycle
      ? await this.prisma.cycleProfile.findUnique({ where: { userId: partnerId } })
      : null;
    const checkIns = shares.shareCheckIns
      ? await this.prisma.wellnessCheckIn.findMany({
          where: { userId: partnerId, deletedAt: null },
          orderBy: { dateKey: 'desc' },
          take: 400,
          select: { dateKey: true },
        })
      : [];
    const meals = shares.shareFoodStreak
      ? await this.prisma.meal.findMany({
          where: { userId: partnerId, deletedAt: null },
          orderBy: { dateKey: 'desc' },
          distinct: ['dateKey'],
          take: 400,
          select: { dateKey: true },
        })
      : [];

    return {
      cycleStartDateKeys: cycles.map((entry) => entry.startDateKey),
      cycleLengthDays: profile?.cycleLengthDays ?? null,
      periodLengthDays: profile?.periodLengthDays ?? null,
      checkInDateKeys: checkIns.map((entry) => entry.dateKey),
      foodLogDateKeys: meals.map((meal) => meal.dateKey),
    };
  }
}
