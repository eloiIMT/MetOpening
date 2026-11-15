import { STOCK_MAX, STOCK_REFILL_MS } from '../game/game-rules';
import { consumeStock, formatCountdown, msUntilNextRefill, settleStock } from './stock-rules';

const MINUTE = 60_000;
const START = 1_000_000;

describe('settleStock', () => {
  it('keeps the stock when less than one refill period has passed', () => {
    expect(settleStock({ stock: 4, refillAnchor: START }, START + 2 * MINUTE)).toEqual({ stock: 4, refillAnchor: START });
  });

  it('adds one case per refill period and moves the anchor forward', () => {
    expect(settleStock({ stock: 4, refillAnchor: START }, START + 7 * MINUTE)).toEqual({
      stock: 6,
      refillAnchor: START + 6 * MINUTE,
    });
  });

  it('never goes above the maximum, even after a long absence', () => {
    expect(settleStock({ stock: 2, refillAnchor: START }, START + 24 * 60 * MINUTE).stock).toBe(STOCK_MAX);
  });
});

describe('msUntilNextRefill', () => {
  it('counts down to the next refill', () => {
    expect(msUntilNextRefill({ stock: 4, refillAnchor: START }, START + 19_000)).toBe(STOCK_REFILL_MS - 19_000);
  });

  it('returns null when the stock is full', () => {
    expect(msUntilNextRefill({ stock: STOCK_MAX, refillAnchor: START }, START)).toBeNull();
  });
});

describe('consumeStock', () => {
  it('removes the opened cases', () => {
    expect(consumeStock({ stock: 5, refillAnchor: START }, 5, START)).toEqual({ stock: 0, refillAnchor: START });
  });

  it('refuses to open more cases than available', () => {
    expect(consumeStock({ stock: 4, refillAnchor: START }, 5, START)).toBeNull();
  });

  it('starts the refill timer when opening from a full stock', () => {
    const now = START + 60 * MINUTE;
    expect(consumeStock({ stock: STOCK_MAX, refillAnchor: START }, 1, now)).toEqual({
      stock: STOCK_MAX - 1,
      refillAnchor: now,
    });
  });
});

describe('formatCountdown', () => {
  it('formats minutes and seconds with two digits', () => {
    expect(formatCountdown(161_000)).toBe('02:41');
  });

  it('rounds partial seconds up', () => {
    expect(formatCountdown(500)).toBe('00:01');
  });
});