import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { STOCK_MAX } from '../game/game-rules';
import { StockState, consumeStock, msUntilNextRefill, settleStock } from './stock-rules';

export const STOCK_STORAGE_KEY = 'met-opening.stock';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly now = signal(Date.now());
  private readonly state = signal(readStoredStock());

  readonly stock = computed(() => settleStock(this.state(), this.now()).stock);
  readonly msUntilNext = computed(() => msUntilNextRefill(this.state(), this.now()));

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  canConsume(amount: number): boolean {
    return consumeStock(this.state(), amount, Date.now()) !== null;
  }

  consume(amount: number): boolean {
    const now = Date.now();
    const next = consumeStock(this.state(), amount, now);
    if (next === null) {
      return false;
    }
    this.state.set(next);
    this.now.set(now);
    saveStock(next);
    return true;
  }
}

function readStoredStock(): StockState {
  const fallback: StockState = { stock: STOCK_MAX, refillAnchor: Date.now() };
  try {
    const raw = localStorage.getItem(STOCK_STORAGE_KEY);
    if (raw === null) {
      return fallback;
    }
    const parsed: unknown = JSON.parse(raw);
    return isStockState(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isStockState(value: unknown): value is StockState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { stock, refillAnchor } = value as Partial<StockState>;
  return (
    typeof stock === 'number' &&
    Number.isInteger(stock) &&
    stock >= 0 &&
    stock <= STOCK_MAX &&
    typeof refillAnchor === 'number' &&
    Number.isFinite(refillAnchor)
  );
}

function saveStock(state: StockState): void {
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}