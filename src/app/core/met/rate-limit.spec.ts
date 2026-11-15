import { delayBeforeNext, recentRequests } from './rate-limit';

const MINUTE = 60_000;

describe('recentRequests', () => {
  it('keeps only the requests made in the last window', () => {
    expect(recentRequests([0, 30_000, 59_999, 60_000], 70_000, MINUTE)).toEqual([30_000, 59_999, 60_000]);
  });
});

describe('delayBeforeNext', () => {
  it('lets a request go at once while under the limit', () => {
    expect(delayBeforeNext([0, 1000], 2000, 3, MINUTE)).toBe(0);
  });

  it('waits until the oldest request leaves the window when the limit is reached', () => {
    expect(delayBeforeNext([10_000, 20_000, 30_000], 40_000, 3, MINUTE)).toBe(30_000);
  });

  it('ignores requests older than the window', () => {
    expect(delayBeforeNext([0, 1000, 2000], 70_000, 3, MINUTE)).toBe(0);
  });
});
