import { Inject, Injectable } from '@nestjs/common';
import { NourishLogger } from '../common/logger/nourish-logger';
import { decideMerge } from './merge';
import { SyncRepository } from './sync.repository';
import { SyncOperationDto } from './dto/sync.dto';

export interface AppliedOperation {
  clientId: string;
  kind: string;
  op: string;
  /** `applied`, `ignored-stale` (an older write arrived) or `unchanged`. */
  outcome: 'applied' | 'ignored-stale' | 'unchanged';
}

export interface RejectedOperation {
  clientId: string | null;
  kind: string | null;
  reason: string;
}

export interface SyncPushResult {
  applied: AppliedOperation[];
  /** Surfaced to the user as a reviewable list, never silently dropped. */
  rejected: RejectedOperation[];
  serverTime: string;
}

export interface SyncPullResult {
  meals: unknown[];
  water: unknown[];
  weight: unknown[];
  serverTime: string;
}

/**
 * Applies a device's queued operations in the order the device recorded them
 * (OFF-02).
 *
 * An operation that fails is rejected individually with a reason: the rest of
 * the queue still applies, because losing a whole batch of offline work to one
 * bad entry is exactly the silent data loss the contract forbids.
 */
@Injectable()
export class SyncService {
  private readonly logger = new NourishLogger('sync');

  constructor(@Inject(SyncRepository) private readonly repo: SyncRepository) {}

  async push(userId: string, operations: SyncOperationDto[]): Promise<SyncPushResult> {
    const applied: AppliedOperation[] = [];
    const rejected: RejectedOperation[] = [];

    for (const op of operations) {
      try {
        const outcome = await this.applyOne(userId, op);
        applied.push({ clientId: op.clientId, kind: op.kind, op: op.op, outcome });
      } catch (error) {
        rejected.push({
          clientId: op.clientId ?? null,
          kind: op.kind ?? null,
          reason: error instanceof Error ? error.message : 'could not be applied',
        });
      }
    }

    this.logger.log('sync push', {
      operations: operations.length,
      applied: applied.length,
      rejected: rejected.length,
    });
    return { applied, rejected, serverTime: new Date().toISOString() };
  }

  async pull(userId: string, since: string | undefined, limit = 500): Promise<SyncPullResult> {
    // A device with no cursor gets everything it has never seen.
    const cursor = since ? new Date(since) : new Date(0);
    const changes = await this.repo.changesSince(userId, cursor, limit);
    return {
      meals: changes.meals.map((meal) => ({
        clientId: meal.clientId,
        dateKey: meal.dateKey,
        slot: meal.slot,
        loggedAt: meal.loggedAt.toISOString(),
        updatedAt: meal.updatedAt.toISOString(),
        deletedAt: meal.deletedAt?.toISOString() ?? null,
        clientSeq: meal.clientSeq,
        items: meal.items.map((item) => ({
          clientId: item.clientId,
          foodId: item.foodId,
          foodName: item.foodName,
          portionUnit: item.portionUnit,
          portionQuantity: item.portionQuantity,
          grams: item.grams,
          kcal: item.kcal,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          fiberG: item.fiberG,
          sodiumMg: item.sodiumMg,
        })),
      })),
      water: changes.water.map((log) => ({
        clientId: log.clientId,
        dateKey: log.dateKey,
        amountMl: log.amountMl,
        loggedAt: log.loggedAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
        deletedAt: log.deletedAt?.toISOString() ?? null,
      })),
      weight: changes.weight.map((log) => ({
        clientId: log.clientId,
        dateKey: log.dateKey,
        weightKg: log.weightKg,
        loggedAt: log.loggedAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
        deletedAt: log.deletedAt?.toISOString() ?? null,
      })),
      serverTime: new Date().toISOString(),
    };
  }

  private async applyOne(
    userId: string,
    op: SyncOperationDto,
  ): Promise<AppliedOperation['outcome']> {
    const updatedAt = new Date(op.updatedAt);

    if (op.kind === 'meal') {
      const existing = await this.repo.findMeal(userId, op.clientId);
      const decision = decideMerge(
        { updatedAt, clientSeq: op.clientSeq },
        existing ? { updatedAt: existing.updatedAt, clientSeq: existing.clientSeq } : null,
      );
      if (decision !== 'apply') return decision === 'stale' ? 'ignored-stale' : 'unchanged';
      this.assertMealIsComplete(op);
      await this.repo.applyMeal(userId, op);
      return 'applied';
    }

    if (op.kind === 'water') {
      const existing = await this.repo.findWaterLog(userId, op.clientId);
      const decision = decideMerge({ updatedAt }, existing);
      if (decision !== 'apply') return decision === 'stale' ? 'ignored-stale' : 'unchanged';
      if (op.op === 'upsert' && op.amountMl == null) {
        throw new Error('a water log needs amountMl');
      }
      await this.repo.applyWater(userId, op);
      return 'applied';
    }

    const existing = await this.repo.findWeightLog(userId, op.clientId);
    const decision = decideMerge({ updatedAt }, existing);
    if (decision !== 'apply') return decision === 'stale' ? 'ignored-stale' : 'unchanged';
    if (op.op === 'upsert' && op.weightKg == null) {
      throw new Error('a weight log needs weightKg');
    }
    await this.repo.applyWeight(userId, op);
    return 'applied';
  }

  /** An upsert must carry what it claims to record; a delete needs nothing. */
  private assertMealIsComplete(op: SyncOperationDto): void {
    if (op.op === 'delete') return;
    if (!op.dateKey) throw new Error('a meal needs a dateKey');
    if (!op.slot) throw new Error('a meal needs a slot');
    if (!op.items || op.items.length === 0) {
      throw new Error('a meal needs at least one item');
    }
  }
}
