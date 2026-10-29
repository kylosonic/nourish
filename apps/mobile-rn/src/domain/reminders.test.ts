import { describe, expect, it } from 'vitest';
import { buildReminderSchedule } from './reminders';

const base = {
  startMinutes: 10 * 60,
  endMinutes: 18 * 60,
  intervalMinutes: 240,
  today: '2026-10-29',
  now: new Date(2026, 9, 29, 9, 0),
};

describe('hydration reminder schedule', () => {
  it('schedules the configured window and interval', () => {
    const result = buildReminderSchedule({ ...base, goalMetToday: false });
    expect(result.slice(0, 3).map((date) => date.getHours())).toEqual([
      10, 14, 18,
    ]);
  });

  it('skips the rest of today once the water goal is met', () => {
    const result = buildReminderSchedule({ ...base, goalMetToday: true });
    expect(result[0].getDate()).toBe(30);
    expect(result[0].getHours()).toBe(10);
  });

  it('skips times that have already passed', () => {
    const result = buildReminderSchedule({
      ...base,
      now: new Date(2026, 9, 29, 15, 0),
      goalMetToday: false,
    });
    expect(result[0].getDate()).toBe(29);
    expect(result[0].getHours()).toBe(18);
  });
});
