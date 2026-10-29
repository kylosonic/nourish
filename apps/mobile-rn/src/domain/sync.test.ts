import { describe, expect, it } from 'vitest';
import type { Meal, SyncChanges } from '../types';
import { mergeRemoteChanges } from './sync';

const LATER = '2026-10-29T12:00:00.000Z';
const EARLIER = '2026-10-29T08:00:00.000Z';

function emptyLocal() {
  return {
    meals: [] as Meal[],
    water: [],
    weights: [],
    queue: [],
    syncCursor: null,
  };
}

function changes(overrides: Partial<SyncChanges> = {}): SyncChanges {
  return {
    meals: [],
    water: [],
    weight: [],
    serverTime: '2026-10-29T12:01:00.000Z',
    ...overrides,
  };
}

describe('account restore merge', () => {
  it('restores a meal and its nutrition snapshot', () => {
    const result = mergeRemoteChanges(
      emptyLocal(),
      changes({
        meals: [
          {
            clientId: 'meal-1',
            dateKey: '2026-10-29',
            slot: 'lunch',
            loggedAt: LATER,
            updatedAt: LATER,
            deletedAt: null,
            clientSeq: 1,
            items: [
              {
                clientId: 'item-1',
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
            ],
          },
        ],
      }),
    );

    expect(result.meals[0].id).toBe('meal-1');
    expect(result.meals[0].items[0].nutrition.kcal).toBe(225);
    expect(result.counts.applied).toBe(1);
  });

  it('keeps a newer local write', () => {
    const result = mergeRemoteChanges(
      {
        ...emptyLocal(),
        water: [
          {
            id: 'water-1',
            dateKey: '2026-10-29',
            amountMl: 500,
            loggedAt: LATER,
            updatedAt: LATER,
          },
        ],
      },
      changes({
        water: [
          {
            clientId: 'water-1',
            dateKey: '2026-10-29',
            amountMl: 250,
            loggedAt: EARLIER,
            updatedAt: EARLIER,
            deletedAt: null,
          },
        ],
      }),
    );
    expect(result.water[0].amountMl).toBe(500);
    expect(result.counts.kept).toBe(1);
  });

  it('applies a newer tombstone and removes stale queued writes', () => {
    const result = mergeRemoteChanges(
      {
        ...emptyLocal(),
        queue: [
          {
            id: 'queue-1',
            kind: 'weight',
            op: 'upsert',
            clientId: 'weight-1',
            clientSeq: 1,
            updatedAt: EARLIER,
            weightKg: 68,
          },
        ],
      },
      changes({
        weight: [
          {
            clientId: 'weight-1',
            dateKey: '2026-10-29',
            weightKg: 68,
            loggedAt: LATER,
            updatedAt: LATER,
            deletedAt: LATER,
          },
        ],
      }),
    );
    expect(result.weights).toEqual([]);
    expect(result.queue).toEqual([]);
    expect(result.counts.removed).toBe(1);
  });

  it('is idempotent when replaying the same delta', () => {
    const delta = changes({
      water: [
        {
          clientId: 'water-1',
          dateKey: '2026-10-29',
          amountMl: 250,
          loggedAt: LATER,
          updatedAt: LATER,
          deletedAt: null,
        },
      ],
    });
    const first = mergeRemoteChanges(emptyLocal(), delta);
    const second = mergeRemoteChanges(first, delta);
    expect(second.water).toHaveLength(1);
    expect(second.counts.unchanged).toBe(1);
  });
});
