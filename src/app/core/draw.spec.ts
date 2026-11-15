import { Artwork, DepartmentId } from './artwork';
import { ARTWORKS_PER_CASE, Rarity } from './game-rules';
import { RandomFn, drawCase, drawCases, pickRandom, poolFor, rollRarity, rollTopRarity } from './draw';

function artwork(id: number, rarity: Rarity, department: DepartmentId = 'asian-art'): Artwork {
  return { id, title: `Artwork ${id}`, artist: null, date: null, year: null, department, rarity, imageSmall: '', image: '', metUrl: '' };
}

function sequence(...values: number[]): RandomFn {
  let index = 0;
  return () => values[index++ % values.length];
}

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL: Artwork[] = [
  artwork(1, 'common'),
  artwork(2, 'common'),
  artwork(3, 'uncommon'),
  artwork(4, 'rare'),
  artwork(5, 'epic'),
  artwork(6, 'legendary'),
  artwork(7, 'common', 'egyptian-art'),
  artwork(8, 'legendary', 'egyptian-art'),
];

describe('rollRarity', () => {
  it('gives a common below 0.50', () => {
    expect(rollRarity(() => 0)).toBe('common');
    expect(rollRarity(() => 0.49)).toBe('common');
  });

  it('gives an uncommon between 0.50 and 0.80', () => {
    expect(rollRarity(() => 0.5)).toBe('uncommon');
    expect(rollRarity(() => 0.79)).toBe('uncommon');
  });

  it('rolls a second time for the top rarity from 0.80', () => {
    expect(rollRarity(sequence(0.8, 0))).toBe('rare');
    expect(rollRarity(sequence(0.9, 0.85))).toBe('epic');
    expect(rollRarity(sequence(0.99, 0.99))).toBe('legendary');
  });

  it('respects the odds over many rolls', () => {
    const random = seeded(42);
    const counts: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    const rolls = 50_000;
    for (let i = 0; i < rolls; i++) {
      counts[rollRarity(random)]++;
    }
    expect(counts.common / rolls).toBeCloseTo(0.5, 1);
    expect(counts.uncommon / rolls).toBeCloseTo(0.3, 1);
    expect(counts.rare / rolls).toBeCloseTo(0.16, 1);
    expect(counts.epic / rolls).toBeGreaterThan(0.025);
    expect(counts.epic / rolls).toBeLessThan(0.045);
    expect(counts.legendary / rolls).toBeGreaterThan(0.003);
    expect(counts.legendary / rolls).toBeLessThan(0.01);
  });
});

describe('rollTopRarity', () => {
  it('gives a rare below 0.80', () => {
    expect(rollTopRarity(() => 0)).toBe('rare');
    expect(rollTopRarity(() => 0.79)).toBe('rare');
  });

  it('gives an epic between 0.80 and 0.97', () => {
    expect(rollTopRarity(() => 0.8)).toBe('epic');
    expect(rollTopRarity(() => 0.96)).toBe('epic');
  });

  it('gives a legendary from 0.97', () => {
    expect(rollTopRarity(() => 0.97)).toBe('legendary');
    expect(rollTopRarity(() => 0.999)).toBe('legendary');
  });
});

describe('drawCase', () => {
  it('always gives 5 artworks', () => {
    expect(drawCase(POOL, seeded(3))).toHaveLength(ARTWORKS_PER_CASE);
  });

  it('can give 5 commons in a row', () => {
    const rarities = drawCase(POOL, () => 0).map((item) => item.rarity);
    expect(rarities).toEqual(['common', 'common', 'common', 'common', 'common']);
  });

  it('can give a legendary', () => {
    const rarities = drawCase(POOL, () => 0.99).map((item) => item.rarity);
    expect(rarities.every((rarity) => rarity === 'legendary')).toBe(true);
  });

  it('only draws from the given department', () => {
    const cases = drawCases(poolFor(POOL, 'egyptian-art'), 10, seeded(7));
    const departments = cases.flat().map((item) => item.department);
    expect(departments.every((department) => department === 'egyptian-art')).toBe(true);
  });

  it('draws the requested number of cases', () => {
    expect(drawCases(POOL, 5, seeded(1))).toHaveLength(5);
  });
});

describe('pickRandom', () => {
  it('refuses an empty list', () => {
    expect(() => pickRandom([], () => 0)).toThrow();
  });
});
