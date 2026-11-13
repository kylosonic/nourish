import type {
  CoupleWellness,
  CycleEntry,
  CycleSymptom,
  PartnerWellnessView,
  WellnessCheckIn,
} from '../types';
import { addDays, dateFromKey, localDateKey } from '../utils/date';

export const MIN_CYCLE_LENGTH_DAYS = 21;
export const MAX_CYCLE_LENGTH_DAYS = 45;
export const MIN_PERIOD_LENGTH_DAYS = 2;
export const MAX_PERIOD_LENGTH_DAYS = 10;

export type CyclePhase =
  | 'unknown'
  | 'menstrual'
  | 'follicular'
  | 'ovulation'
  | 'luteal';

export interface CycleSnapshot {
  cycleDay: number | null;
  expectedPeriodStart: string | null;
  daysUntilPeriod: number | null;
  predictionCycleLengthDays: number | null;
  irregular: boolean;
  phase: CyclePhase;
  fertileStart: string | null;
  fertileEnd: string | null;
  periodActive: boolean;
}

export interface CalendarDay {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  status:
    | 'recordedPeriod'
    | 'predictedPeriod'
    | 'fertile'
    | 'ovulation'
    | null;
}

export interface StreakSummary {
  current: number;
  best: number;
  checkedInToday: boolean;
}

export const cycleSymptoms: { id: CycleSymptom; label: string }[] = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'backache', label: 'Backache' },
  { id: 'mood', label: 'Mood shift' },
];

export function daysBetween(fromKey: string, toKey: string): number {
  const from = dateFromKey(fromKey);
  const to = dateFromKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function clampCycleSettings(
  cycleLengthDays: number,
  periodLengthDays: number,
): { cycleLengthDays: number; periodLengthDays: number } {
  const cycle = Math.round(
    Math.min(
      MAX_CYCLE_LENGTH_DAYS,
      Math.max(MIN_CYCLE_LENGTH_DAYS, cycleLengthDays),
    ),
  );
  return {
    cycleLengthDays: cycle,
    periodLengthDays: Math.round(
      Math.min(
        Math.min(MAX_PERIOD_LENGTH_DAYS, cycle - 1),
        Math.max(MIN_PERIOD_LENGTH_DAYS, periodLengthDays),
      ),
    ),
  };
}

export function activeCycleEntries(
  entries: CycleEntry[],
  todayKey = localDateKey(),
): CycleEntry[] {
  return Array.from(
    new Map(
      entries
        .filter((entry) => entry.startDateKey <= todayKey)
        .map((entry) => [entry.startDateKey, entry]),
    ).values(),
  ).sort((a, b) => a.startDateKey.localeCompare(b.startDateKey));
}

/**
 * Estimate the recent cycle length from recorded starts. This is arithmetic,
 * never a diagnosis: unusual intervals still produce a bounded estimate and an
 * explicit "less predictable" flag rather than a medical conclusion.
 */
export function estimateCycleLength(
  entries: CycleEntry[],
  fallbackDays: number,
): { cycleLengthDays: number; irregular: boolean } {
  const starts = activeCycleEntries(entries).map((entry) => entry.startDateKey);
  const intervals = starts
    .slice(1)
    .map((start, index) => daysBetween(starts[index], start))
    .filter((days) => days >= MIN_CYCLE_LENGTH_DAYS && days <= MAX_CYCLE_LENGTH_DAYS)
    .slice(-6);
  const settings = clampCycleSettings(fallbackDays, 5);
  if (intervals.length === 0) {
    return { cycleLengthDays: settings.cycleLengthDays, irregular: false };
  }
  const average = Math.round(
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length,
  );
  return {
    cycleLengthDays: clampCycleSettings(average, 5).cycleLengthDays,
    irregular:
      intervals.length >= 2 &&
      Math.max(...intervals) - Math.min(...intervals) > 7,
  };
}

function entryEnd(entry: CycleEntry, periodLengthDays: number): string {
  return entry.endDateKey ?? addDays(entry.startDateKey, periodLengthDays - 1);
}

/** Forward-only estimate from the most recent recorded period. */
export function getCycleSnapshot(
  wellness: Pick<
    CoupleWellness,
    'cycleEntries' | 'cycleLengthDays' | 'periodLengthDays'
  >,
  todayKey = localDateKey(),
): CycleSnapshot {
  const entries = activeCycleEntries(wellness.cycleEntries, todayKey);
  const last = entries.at(-1);
  if (!last) {
    return {
      cycleDay: null,
      expectedPeriodStart: null,
      daysUntilPeriod: null,
      predictionCycleLengthDays: null,
      irregular: false,
      phase: 'unknown',
      fertileStart: null,
      fertileEnd: null,
      periodActive: false,
    };
  }

  const settings = clampCycleSettings(
    wellness.cycleLengthDays,
    wellness.periodLengthDays,
  );
  const estimate = estimateCycleLength(entries, settings.cycleLengthDays);
  const cycleLength = estimate.cycleLengthDays;
  const latestEnd = entryEnd(last, settings.periodLengthDays);
  const periodActive = todayKey >= last.startDateKey && todayKey <= latestEnd;
  const expectedPeriodStart = addDays(last.startDateKey, cycleLength);
  const daysUntilPeriod = daysBetween(todayKey, expectedPeriodStart);
  const ovulation = addDays(expectedPeriodStart, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  let phase: CyclePhase = 'follicular';
  if (periodActive) phase = 'menstrual';
  else if (todayKey >= fertileStart && todayKey <= fertileEnd) {
    phase = 'ovulation';
  } else if (todayKey > fertileEnd) {
    phase = 'luteal';
  }

  return {
    cycleDay: Math.max(1, daysBetween(last.startDateKey, todayKey) + 1),
    expectedPeriodStart,
    daysUntilPeriod,
    predictionCycleLengthDays: cycleLength,
    irregular: estimate.irregular,
    phase,
    fertileStart,
    fertileEnd,
    periodActive,
  };
}

/**
 * A six-week calendar grid. Recorded starts and explicit end dates take priority
 * over predicted period days, which take priority over the fertile estimate.
 */
export function buildCycleCalendar(
  month: Date,
  wellness: Pick<
    CoupleWellness,
    'cycleEntries' | 'cycleLengthDays' | 'periodLengthDays'
  >,
  todayKey = localDateKey(),
): CalendarDay[] {
  const settings = clampCycleSettings(
    wellness.cycleLengthDays,
    wellness.periodLengthDays,
  );
  const entries = activeCycleEntries(wellness.cycleEntries, todayKey);
  const estimate = estimateCycleLength(entries, settings.cycleLengthDays);
  const projectedStarts = new Set<string>();
  for (const entry of entries) {
    for (let index = 0; index <= 24; index += 1) {
      projectedStarts.add(
        addDays(entry.startDateKey, index * estimate.cycleLengthDays),
      );
    }
  }

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const gridStart = addDays(localDateKey(monthStart), -monthStart.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const dateKey = addDays(gridStart, index);
    const date = dateFromKey(dateKey);
    const inRecordedPeriod = entries.some(
      (entry) =>
        dateKey >= entry.startDateKey &&
        dateKey <= entryEnd(entry, settings.periodLengthDays),
    );
    const inPredictedPeriod = Array.from(projectedStarts).some((start) => {
      const offset = daysBetween(start, dateKey);
      return offset >= 0 && offset < settings.periodLengthDays;
    });
    const fertile = Array.from(projectedStarts).some((start) => {
      const ovulation = addDays(start, -14);
      return dateKey >= addDays(ovulation, -5) && dateKey <= addDays(ovulation, 1);
    });
    const ovulation = Array.from(projectedStarts).some(
      (start) => dateKey === addDays(start, -14),
    );

    return {
      dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      isToday: dateKey === todayKey,
      status: inRecordedPeriod
        ? 'recordedPeriod'
        : inPredictedPeriod
          ? 'predictedPeriod'
          : ovulation
            ? 'ovulation'
            : fertile
              ? 'fertile'
              : null,
    };
  });
}

export function streakFromDates(
  rawDates: string[],
  todayKey = localDateKey(),
): StreakSummary {
  const dates = Array.from(new Set(rawDates))
    .filter((dateKey) => dateKey <= todayKey)
    .sort();
  if (dates.length === 0) {
    return { current: 0, best: 0, checkedInToday: false };
  }

  let best = 1;
  let run = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (daysBetween(dates[index - 1], dates[index]) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }

  const checkedInToday = dates.includes(todayKey);
  let cursor = checkedInToday ? todayKey : addDays(todayKey, -1);
  let current = 0;
  const dateSet = new Set(dates);
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best: Math.max(best, current), checkedInToday };
}

export function checkInStreak(
  checkIns: WellnessCheckIn[],
  todayKey = localDateKey(),
): StreakSummary {
  return streakFromDates(
    checkIns.map((checkIn) => checkIn.dateKey),
    todayKey,
  );
}

export function mealStreak(
  mealDateKeys: string[],
  todayKey = localDateKey(),
): StreakSummary {
  return streakFromDates(mealDateKeys, todayKey);
}

/**
 * Shared streak dates require both people to have enabled sharing and both to
 * have checked in on the same day.
 */
export function sharedCheckInDates(
  wellness: CoupleWellness,
  partnerCheckIns: string[] = [],
): string[] {
  if (
    !wellness.connection?.mySharing.shareCheckIns ||
    !wellness.connection.partnerSharing.shareCheckIns
  ) {
    return [];
  }
  const mine = new Set(wellness.checkIns.map((checkIn) => checkIn.dateKey));
  return partnerCheckIns.filter((dateKey) => mine.has(dateKey)).sort();
}

export function sharedFoodDates(
  mealDateKeys: string[],
  partnerFoodDates: string[] = [],
): string[] {
  const mine = new Set(mealDateKeys);
  return partnerFoodDates.filter((dateKey) => mine.has(dateKey)).sort();
}

export function phaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case 'menstrual':
      return 'Period window';
    case 'follicular':
      return 'Follicular estimate';
    case 'ovulation':
      return 'Likely fertile window';
    case 'luteal':
      return 'Luteal estimate';
    default:
      return 'Cycle estimate';
  }
}

function shortDate(dateKey: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(dateFromKey(dateKey));
}

export function partnerCycleWellness(
  partner: PartnerWellnessView | null,
): Pick<CoupleWellness, 'cycleEntries' | 'cycleLengthDays' | 'periodLengthDays'> | null {
  if (!partner || partner.cycleLengthDays == null) return null;
  return {
    cycleLengthDays: partner.cycleLengthDays,
    periodLengthDays: partner.periodLengthDays ?? 5,
    cycleEntries: partner.cycleStartDateKeys.map((startDateKey) => ({
      id: `partner-${startDateKey}`,
      startDateKey,
      endDateKey: null,
      symptoms: [],
      updatedAt: '',
      clientSeq: 0,
    })),
  };
}

export function buildCareCardMessage(
  wellness: CoupleWellness,
  mealDates: string[],
  todayKey = localDateKey(),
): string {
  const snapshot = getCycleSnapshot(wellness, todayKey);
  const care = checkInStreak(wellness.checkIns, todayKey);
  const partnerCheckIns = wellness.connection?.partnerView.checkInDateKeys ?? [];
  const shared = streakFromDates(
    sharedCheckInDates(wellness, partnerCheckIns),
    todayKey,
  );
  const nourish = mealStreak(mealDates, todayKey);
  const greeting = wellness.connection?.partnerName
    ? `Hi ${wellness.connection.partnerName},`
    : 'Hi,';
  const lines = ['Nourish care card', '', greeting];

  if (wellness.connection?.mySharing.shareCycle && snapshot.expectedPeriodStart) {
    if (snapshot.periodActive) {
      lines.push('I’m in my estimated period window.');
    } else if (snapshot.daysUntilPeriod === 0) {
      lines.push('My period is expected today.');
    } else if ((snapshot.daysUntilPeriod ?? 0) > 0) {
      lines.push(
        `My next period is estimated in ${snapshot.daysUntilPeriod} day${snapshot.daysUntilPeriod === 1 ? '' : 's'} (${shortDate(snapshot.expectedPeriodStart)}).`,
      );
    }
    lines.push('These dates are estimates, not medical advice.');
  }

  if (wellness.connection?.mySharing.shareCheckIns) {
    lines.push(
      care.checkedInToday
        ? 'I checked in today.'
        : 'I have not checked in yet today.',
    );
    lines.push(
      `Current care streak: ${care.current} day${care.current === 1 ? '' : 's'}.`,
    );
    if (shared.current > 0) {
      lines.push(
        `Shared couple streak: ${shared.current} day${shared.current === 1 ? '' : 's'}.`,
      );
    }
  }

  if (wellness.connection?.mySharing.shareFoodStreak) {
    lines.push(
      `Nourish food-logging streak: ${nourish.current} day${nourish.current === 1 ? '' : 's'}.`,
    );
  }
  lines.push('', 'Shared by me from Nourish.');
  return lines.join('\n');
}
