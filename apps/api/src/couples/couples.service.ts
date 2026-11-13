import { createHash, randomInt } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';
import { CouplesRepository } from './couples.repository';
import { UpdateCoupleSharingDto } from './dto/couples.dto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CoupleSharingView {
  shareCycle: boolean;
  shareCheckIns: boolean;
  shareFoodStreak: boolean;
}

export interface PartnerSharedView {
  cycleStartDateKeys: string[];
  cycleLengthDays: number | null;
  periodLengthDays: number | null;
  checkInDateKeys: string[];
  foodLogDateKeys: string[];
}

export interface CoupleStateView {
  connection: {
    id: string;
    partnerName: string;
    connectedAt: string;
    mySharing: CoupleSharingView;
    partnerSharing: CoupleSharingView;
    partnerView: PartnerSharedView;
  } | null;
}

@Injectable()
export class CouplesService {
  constructor(
    @Inject(CouplesRepository) private readonly repo: CouplesRepository,
  ) {}

  async state(userId: string): Promise<CoupleStateView> {
    const connection = await this.repo.findActiveConnection(userId);
    if (!connection) return { connection: null };

    const partnerId =
      connection.userOneId === userId
        ? connection.userTwoId
        : connection.userOneId;
    const partner =
      connection.userOneId === userId
        ? connection.userTwo
        : connection.userOne;
    const mine =
      connection.preferences.find((preference) => preference.userId === userId) ??
      null;
    const theirs =
      connection.preferences.find(
        (preference) => preference.userId === partnerId,
      ) ?? null;
    const mySharing = this.sharingView(mine);
    const partnerSharing = this.sharingView(theirs);
    const partnerView = await this.repo.partnerData(partnerId, partnerSharing);

    return {
      connection: {
        id: connection.id,
        partnerName: partner.displayName?.trim() || 'Your partner',
        connectedAt: connection.createdAt.toISOString(),
        mySharing,
        partnerSharing,
        partnerView,
      },
    };
  }

  async createInvitation(
    userId: string,
  ): Promise<{ code: string; expiresAt: string }> {
    if (await this.repo.findActiveConnection(userId)) {
      throw new NourishHttpException(
        HttpStatus.CONFLICT,
        ErrorCode.COUPLE_ALREADY_PAIRED,
        'You are already connected to a partner.',
      );
    }

    let code = '';
    let codeHash = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = Array.from(
        { length: 8 },
        () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)],
      ).join('');
      codeHash = this.hashCode(code);
      // A collision would be rejected by the unique index. Retrying here keeps
      // the user-visible failure rate effectively zero.
      const duplicate = await this.repo.findInvitationHash(codeHash);
      if (!duplicate) break;
      code = '';
    }
    if (!code) {
      throw new NourishHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.INTERNAL,
        'Could not create a couple code. Please try again.',
      );
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await this.repo.createInvitation({ inviterId: userId, codeHash, expiresAt });
    return { code, expiresAt: expiresAt.toISOString() };
  }

  async join(userId: string, rawCode: string): Promise<CoupleStateView> {
    const code = rawCode.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!/^[A-Z2-9]{8}$/.test(code)) this.invalidInvite();
    const outcome = await this.repo.joinInvitation(
      userId,
      this.hashCode(code),
      new Date(),
    );
    if (outcome === 'invalid') this.invalidInvite();
    if (outcome === 'self') {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.COUPLE_INVITE_INVALID,
        'This code belongs to you. Share it with your partner.',
      );
    }
    if (outcome === 'paired') {
      throw new NourishHttpException(
        HttpStatus.CONFLICT,
        ErrorCode.COUPLE_ALREADY_PAIRED,
        'One of these accounts is already connected to a partner.',
      );
    }
    return this.state(userId);
  }

  async updateSharing(
    userId: string,
    patch: UpdateCoupleSharingDto,
  ): Promise<CoupleStateView> {
    if (
      patch.shareCycle == null &&
      patch.shareCheckIns == null &&
      patch.shareFoodStreak == null
    ) {
      throw new NourishHttpException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.COUPLE_SHARING_UPDATE_EMPTY,
        'Choose at least one sharing setting to change.',
      );
    }
    const connection = await this.repo.findActiveConnection(userId);
    if (!connection) this.connectionNotFound();
    const updated = await this.repo.updateSharing(
      userId,
      connection.id,
      patch,
    );
    if (!updated) this.connectionNotFound();
    return this.state(userId);
  }

  async disconnect(userId: string): Promise<void> {
    if (!(await this.repo.endConnection(userId, new Date()))) {
      this.connectionNotFound();
    }
  }

  private sharingView(
    preference:
      | {
          shareCycle: boolean;
          shareCheckIns: boolean;
          shareFoodStreak: boolean;
        }
      | null,
  ): CoupleSharingView {
    return {
      shareCycle: preference?.shareCycle === true,
      shareCheckIns: preference?.shareCheckIns === true,
      shareFoodStreak: preference?.shareFoodStreak === true,
    };
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private invalidInvite(): never {
    throw new NourishHttpException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.COUPLE_INVITE_INVALID,
      'That couple code is invalid or has expired.',
    );
  }

  private connectionNotFound(): never {
    throw new NourishHttpException(
      HttpStatus.NOT_FOUND,
      ErrorCode.COUPLE_CONNECTION_NOT_FOUND,
      'No active couple connection was found.',
    );
  }
}
