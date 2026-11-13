import { describe, expect, it } from 'vitest';
import type {
  CoupleConnectionState,
  CoupleWellness,
  CycleEntry,
} from '../types';
import {
  buildCareCardMessage,
  buildCycleCalendar,
  checkInStreak,
  getCycleSnapshot,
  sharedCheckInDates,
  streakFromDates,
} from './couples';

function entry(
  startDateKey: string,
  endDateKey: string | null = null,
): CycleEntry {
  return {
    id: `cycle_${startDateKey}`,
    startDateKey,
    endDateKey,
    symptoms: ['cramps'],
    updatedAt: '2026-10-29T10:00:00.000Z',
    clientSeq: 1,
  };
}

function connection(
  myCheckIns: boolean,
  partnerCheckIns: boolean,
): CoupleConnectionState {
  return {
    id: 'couple-1',
    partnerName: 'Sam',
    connectedAt: '2026-10-01T10:00:00.000Z',
    mySharing: {
      shareCycle: true,
      shareCheckIns: myCheckIns,
      shareFoodStreak: false,
    },
    partnerSharing: {
      shareCycle: false,
      shareCheckIns: partnerCheckIns,
      shareFoodStreak: false,
    },
    partnerView: {
      cycleStartDateKeys: [],
      cycleLengthDays: null,
      periodLengthDays: null,
      checkInDateKeys: ['2026-10-28', '2026-10-29'],
      foodLogDateKeys: [],
    },
  };
}

function wellness(overrides: Partial<CoupleWellness> = {}): CoupleWellness {
  return {
    trackingEnabled: true,
    cycleLengthDays: 28,
    periodLengthDays: 5,
    cycleEntries: [],
    checkIns: [],
    profileUpdatedAt: null,
    connection: null,
    invitation: null,
    lastFetchedAt: null,
    ...overrides,
  };
}

describe('cycle prediction', () => {
  it('returns an honest unknown state without a recorded period', () => {
    const snapshot = getCycleSnapshot(wellness(), '2026-10-29');
    expect(snapshot.phase).toBe('unknown');
    expect(snapshot.expectedPeriodStart).toBeNull();
  });

  it('uses deterministic date arithmetic for the next period and fertile window', () => {
    const snapshot = getCycleSnapshot(
      wellness({ cycleEntries: [entry('2026-10-01')] }),
      '2026-10-15',
    );
    expect(snapshot.cycleDay).toBe(15);
    expect(snapshot.expectedPeriodStart).toBe('2026-10-29');
    expect(snapshot.daysUntilPeriod).toBe(14);
    expect(snapshot.fertileStart).toBe('2026-10-10');
    expect(snapshot.fertileEnd).toBe('2026-10-16');
  });

  it('honours an explicit period end at its boundary', () => {
    const cycle = wellness({
      cycleEntries: [entry('2026-10-20', '2026-10-24')],
    });
    expect(getCycleSnapshot(cycle, '2026-10-24').periodActive).toBe(true);
    expect(getCycleSnapshot(cycle, '2026-10-25').periodActive).toBe(false);
  });

  it('adapts to recent starts and flags variation without diagnosing', () => {
    const snapshot = getCycleSnapshot(
      wellness({
        cycleEntries: [
          entry('2026-08-01'),
          entry('2026-08-29'),
          entry('2026-10-08'),
        ],
      }),
      '2026-10-15',
    );
    expect(snapshot.predictionCycleLengthDays).toBe(34);
    expect(snapshot.irregular).toBe(true);
  });

  it('prioritises recorded period days in the six-week calendar', () => {
    const days = buildCycleCalendar(
      new Date(2026, 9, 1, 12),
      wellness({
        cycleEntries: [entry('2026-10-01', '2026-10-03')],
      }),
      '2026-10-15',
    );
    expect(days.find((day) => day.dateKey === '2026-10-02')?.status).toBe(
      'recordedPeriod',
    );
    expect(days.find((day) => day.dateKey === '2026-10-29')?.status).toBe(
      'predictedPeriod',
    );
  });
});

describe('wellness streaks', () => {
  it('continues a streak through yesterday but marks today as unchecked', () => {
    const streak = streakFromDates(
      ['2026-10-26', '2026-10-27', '2026-10-28'],
      '2026-10-29',
    );
    expect(streak.current).toBe(3);
    expect(streak.checkedInToday).toBe(false);
  });

  it('only computes a shared streak when both people share check-ins', () => {
    const checkIns = [
      { id: 'a', dateKey: '2026-10-28', updatedAt: '', clientSeq: 1 },
      { id: 'b', dateKey: '2026-10-29', updatedAt: '', clientSeq: 1 },
    ];
    const both = wellness({
      checkIns,
      connection: connection(true, true),
    });
    expect(sharedCheckInDates(both, ['2026-10-28', '2026-10-29'])).toEqual([
      '2026-10-28',
      '2026-10-29',
    ]);

    const revoked = wellness({
      checkIns,
      connection: connection(false, true),
    });
    expect(sharedCheckInDates(revoked, ['2026-10-28', '2026-10-29'])).toEqual([]);
  });

  it('never puts private symptoms in the partner care card', () => {
    const message = buildCareCardMessage(
      wellness({
        cycleEntries: [entry('2026-10-01', '2026-10-05')],
        checkIns: [
          { id: 'a', dateKey: '2026-10-29', updatedAt: '', clientSeq: 1 },
        ],
        connection: connection(true, true),
      }),
      ['2026-10-29'],
      '2026-10-29',
    );
    expect(message).toContain('period is expected today');
    expect(message).not.toContain('cramps');
    expect(message).toContain('medical advice');
  });

  it('does not count future check-ins', () => {
    expect(
      checkInStreak(
        [
          { id: 'a', dateKey: '2026-10-29', updatedAt: '', clientSeq: 1 },
          { id: 'b', dateKey: '2026-10-30', updatedAt: '', clientSeq: 1 },
        ],
        '2026-10-29',
      ).current,
    ).toBe(1);
  });
});
