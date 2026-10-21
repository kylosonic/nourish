const pad = (value: number) => String(value).padStart(2, '0');

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function startOfTrailingWeek(today = new Date()): string {
  return addDays(localDateKey(today), -6);
}

export function weekdayShort(key: string): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(dateFromKey(key)).toUpperCase();
}

export function dayNumber(key: string): string {
  return String(dateFromKey(key).getDate());
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function dateStrip(centerKey: string, before = 2, after = 2): string[] {
  return Array.from({ length: before + after + 1 }, (_, index) =>
    addDays(centerKey, index - before),
  );
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
