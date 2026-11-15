export function recentRequests(history: readonly number[], now: number, windowMs: number): number[] {
  return history.filter((time) => now - time < windowMs);
}

export function delayBeforeNext(history: readonly number[], now: number, limit: number, windowMs: number): number {
  const recent = recentRequests(history, now, windowMs);
  if (recent.length < limit) {
    return 0;
  }
  const oldest = Math.min(...recent);
  return oldest + windowMs - now;
}
