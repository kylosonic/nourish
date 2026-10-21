export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (value: string) =>
    value
      .trim()
      .replace(/^v/i, '')
      .split(/[.+-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10) || 0);
  const next = parse(latest);
  const installed = parse(current);
  for (let index = 0; index < 3; index += 1) {
    if (next[index] > installed[index]) return true;
    if (next[index] < installed[index]) return false;
  }
  return false;
}
