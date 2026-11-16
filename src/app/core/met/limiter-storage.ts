const LIMITER_STORAGE_KEY = 'met-opening.met-limiter';

interface LimiterState {
  readonly history: readonly number[];
  readonly pausedUntil: number;
}

export function readLimiter(): LimiterState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LIMITER_STORAGE_KEY) ?? 'null',
    ) as Partial<LimiterState> | null;
    const history = Array.isArray(parsed?.history)
      ? parsed.history.filter((time) => typeof time === 'number')
      : [];
    const pausedUntil = typeof parsed?.pausedUntil === 'number' ? parsed.pausedUntil : 0;
    return { history, pausedUntil };
  } catch {
    return { history: [], pausedUntil: 0 };
  }
}

export function saveLimiter(state: LimiterState): void {
  try {
    localStorage.setItem(LIMITER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
