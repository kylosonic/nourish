import { Inject, Injectable } from '@nestjs/common';
import { Meal, MealItem, WaterLog, WeightLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncMealItemDto, SyncOperationDto } from './dto/sync.dto';

export type MealWithItems = Meal & { items: MealItem[] };

/** Everything the device needs to converge, tombstones included. */
export interface ChangeSet {
  meals: MealWithItems[];
  water: WaterLog[];
  weight: WeightLog[];
}

/**
 * Persistence for the device→server mirror. One operation is applied in one
 * transaction, so a partially applied queue entry cannot exist.
 */
@Injectable()
export class SyncRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMeal(userId: string, clientId: string): Promise<MealWithItems | null> {
    return this.prisma.meal.findUnique({
      where: { userId_clientId: { userId, clientId } },
      include: { items: true },
    });
  }

  async findWaterLog(userId: string, clientId: string): Promise<WaterLog | null> {
    return this.prisma.waterLog.findUnique({
      where: { userId_clientId: { userId, clientId } },
    });
  }

  async findWeightLog(userId: string, clientId: string): Promise<WeightLog | null> {
    return this.prisma.weightLog.findUnique({
      where: { userId_clientId: { userId, clientId } },
    });
  }

  /**
   * Upsert a meal and replace its items. Items are replaced rather than merged:
   * an edit that removed an item must remove it here too, and the whole write is
   * inside one transaction so the meal and its items can never disagree.
   */
  async applyMeal(userId: string, op: SyncOperationDto): Promise<MealWithItems> {
    const items: SyncMealItemDto[] = op.items ?? [];
    return this.prisma.$transaction(async (tx) => {
      const meal = await tx.meal.upsert({
        where: { userId_clientId: { userId, clientId: op.clientId } },
        create: {
          userId,
          clientId: op.clientId,
          dateKey: op.dateKey ?? '',
          slot: op.slot ?? 'other',
          loggedAt: op.loggedAt ? new Date(op.loggedAt) : new Date(op.updatedAt),
          updatedAt: new Date(op.updatedAt),
          clientSeq: op.clientSeq ?? 0,
          deletedAt: op.op === 'delete' ? new Date(op.updatedAt) : null,
        },
        update: {
          dateKey: op.dateKey ?? undefined,
          slot: op.slot ?? undefined,
          loggedAt: op.loggedAt ? new Date(op.loggedAt) : undefined,
          updatedAt: new Date(op.updatedAt),
          clientSeq: op.clientSeq ?? 0,
          deletedAt: op.op === 'delete' ? new Date(op.updatedAt) : null,
        },
      });

      if (op.op === 'delete') {
        // A tombstone keeps the row (and its items) so the deletion can travel
        // to the user's other devices; the items are left intact for that.
        return tx.meal.findUniqueOrThrow({
          where: { id: meal.id },
          include: { items: true },
        });
      }

      await tx.mealItem.deleteMany({ where: { mealId: meal.id } });
      if (items.length) {
        await tx.mealItem.createMany({
          data: items.map((item) => ({
            mealId: meal.id,
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
            fiberG: item.fiberG ?? null,
            sodiumMg: item.sodiumMg ?? null,
          })),
        });
      }
      return tx.meal.findUniqueOrThrow({
        where: { id: meal.id },
        include: { items: true },
      });
    });
  }

  async applyWater(userId: string, op: SyncOperationDto): Promise<WaterLog> {
    const data = {
      dateKey: op.dateKey ?? '',
      amountMl: op.amountMl ?? 0,
      loggedAt: op.loggedAt ? new Date(op.loggedAt) : new Date(op.updatedAt),
      updatedAt: new Date(op.updatedAt),
      deletedAt: op.op === 'delete' ? new Date(op.updatedAt) : null,
    };
    return this.prisma.waterLog.upsert({
      where: { userId_clientId: { userId, clientId: op.clientId } },
      create: { userId, clientId: op.clientId, ...data },
      update: data,
    });
  }

  async applyWeight(userId: string, op: SyncOperationDto): Promise<WeightLog> {
    const data = {
      dateKey: op.dateKey ?? '',
      weightKg: op.weightKg ?? 0,
      loggedAt: op.loggedAt ? new Date(op.loggedAt) : new Date(op.updatedAt),
      updatedAt: new Date(op.updatedAt),
      deletedAt: op.op === 'delete' ? new Date(op.updatedAt) : null,
    };
    return this.prisma.weightLog.upsert({
      where: { userId_clientId: { userId, clientId: op.clientId } },
      create: { userId, clientId: op.clientId, ...data },
      update: data,
    });
  }

  /**
   * Everything changed after the cursor, oldest first. Tombstones are included
   * deliberately: a device that was offline when a deletion happened must learn
   * about it, and the contract forbids silent data loss on either side.
   */
  async changesSince(userId: string, since: Date, limit: number): Promise<ChangeSet> {
    const where = { userId, updatedAt: { gt: since } };
    const [meals, water, weight] = await this.prisma.$transaction([
      this.prisma.meal.findMany({
        where,
        include: { items: true },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.waterLog.findMany({
        where,
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.weightLog.findMany({
        where,
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
    ]);
    return { meals, water, weight };
  }
}
