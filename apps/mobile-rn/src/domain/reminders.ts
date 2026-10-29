export interface ReminderScheduleInput {
  startMinutes: number;
  endMinutes: number;
  intervalMinutes: number;
  today: string;
  goalMetToday: boolean;
  now?: Date;
}

/** Build up to one week of local reminder dates, suppressing today's remainder. */
export function buildReminderSchedule(input: ReminderScheduleInput): Date[] {
  const start = Math.max(0, Math.min(1439, input.startMinutes));
  const end = Math.max(start, Math.min(1439, input.endMinutes));
  const interval = Math.max(60, Math.min(720, input.intervalMinutes));
  const now = input.now ?? new Date();
  const result: Date[] = [];
  const current = new Date(
    Number(input.today.slice(0, 4)),
    Number(input.today.slice(5, 7)) - 1,
    Number(input.today.slice(8, 10)),
    0,
    0,
    0,
    0,
  );
  for (
    let day = 0;
    day < 7 && result.length < 60;
    day += 1
  ) {
    const date = new Date(current);
    date.setDate(current.getDate() + day);
    for (
      let minute = start;
      minute <= end && result.length < 60;
      minute += interval
    ) {
      const occurrence = new Date(date);
      occurrence.setMinutes(minute);
      if (day === 0 && (input.goalMetToday || occurrence <= now)) continue;
      result.push(occurrence);
    }
  }
  return result;
}
