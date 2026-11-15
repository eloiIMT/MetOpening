import { STOCK_MAX, STOCK_REFILL_MS } from '../game/game-rules';

export interface StockState {
  readonly stock: number;
  readonly refillAnchor: number;
}

export function settleStock(state: StockState, now: number): StockState {
  if (state.stock >= STOCK_MAX) {
    return { stock: STOCK_MAX, refillAnchor: now };
  }
  const elapsed = Math.max(0, now - state.refillAnchor);
  const gained = Math.floor(elapsed / STOCK_REFILL_MS);
  const stock = Math.min(STOCK_MAX, state.stock + gained);
  if (stock >= STOCK_MAX) {
    return { stock: STOCK_MAX, refillAnchor: now };
  }
  return { stock, refillAnchor: state.refillAnchor + gained * STOCK_REFILL_MS };
}

export function msUntilNextRefill(state: StockState, now: number): number | null {
  const settled = settleStock(state, now);
  if (settled.stock >= STOCK_MAX) {
    return null;
  }
  return settled.refillAnchor + STOCK_REFILL_MS - now;
}

export function consumeStock(state: StockState, amount: number, now: number): StockState | null {
  const settled = settleStock(state, now);
  if (!Number.isInteger(amount) || amount <= 0 || amount > settled.stock) {
    return null;
  }
  return { stock: settled.stock - amount, refillAnchor: settled.refillAnchor };
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}