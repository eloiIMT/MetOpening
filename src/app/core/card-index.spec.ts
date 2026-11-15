import { CardIndexFile, decodeCardIndex, findEntry, poolIds } from './card-index';

const FILE: CardIndexFile = {
  version: 1,
  departments: ['asian-art', 'egyptian-art'],
  objectIdDeltas: [12, 28, 460, 10],
  tiers: '0244',
  departmentCodes: '0011',
  centuries: [18, 0, -14, 3],
};

describe('decodeCardIndex', () => {
  it('rebuilds the sorted ids from the gaps', () => {
    expect([...decodeCardIndex(FILE).ids]).toEqual([12, 40, 500, 510]);
  });

  it('refuses an index made for another version', () => {
    expect(() => decodeCardIndex({ ...FILE, version: 2 })).toThrow();
  });
});

describe('findEntry', () => {
  const index = decodeCardIndex(FILE);

  it('finds a work and reads its rarity, department and century', () => {
    expect(findEntry(index, 500)).toEqual({ id: 500, rarity: 'legendary', department: 'egyptian-art', century: -14 });
  });

  it('turns an unknown century into null', () => {
    expect(findEntry(index, 40)?.century).toBeNull();
  });

  it('returns null for a work that is not in the pool', () => {
    expect(findEntry(index, 41)).toBeNull();
  });
});

describe('poolIds', () => {
  const index = decodeCardIndex(FILE);

  it('lists the works of a rarity in every department', () => {
    expect(poolIds(index, 'legendary', null)).toEqual([500, 510]);
  });

  it('can keep only one department', () => {
    expect(poolIds(index, 'rare', 'asian-art')).toEqual([40]);
    expect(poolIds(index, 'rare', 'egyptian-art')).toEqual([]);
  });
});
