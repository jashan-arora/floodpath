/** ISO timestamp `minutes` before `now`, so seeded data always looks recent. */
export function minutesAgo(minutes: number, now: number = Date.now()): string {
  return new Date(now - minutes * 60_000).toISOString();
}
