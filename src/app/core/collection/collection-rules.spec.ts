import { Artwork } from '../artworks/artwork';
import { OwnedEntry, OwnedMap, addToCollection, resellDuplicates, sellCopies, sortByRarity } from './collection-rules';
import { Rarity } from '../game/game-rules';

function artwork(id: number, rarity: Rarity = 'common'): Artwork {
  return {
    id,
    title: `Artwork ${id}`,
    artist: null,
    date: null,
    year: null,
    department: 'asian-art',
    rarity,
    imageSmall: '',
    image: '',
    metUrl: '',
  };
}

const NOW = 1_000_000;

function owns(id: number, count: number): OwnedEntry {
  return { count, firstObtainedAt: NOW, artwork: artwork(id) };
}

describe('addToCollection', () => {
  it('adds a new artwork with one copy', () => {
    const { owned, drawn } = addToCollection({}, [artwork(1)], NOW);
    expect(owned[1]).toEqual(owns(1, 1));
    expect(drawn[0].isNew).toBe(true);
  });

  it('counts a second copy as a duplicate', () => {
    const before: OwnedMap = { 1: owns(1, 1) };
    const { owned, drawn } = addToCollection(before, [artwork(1)], NOW + 500);
    expect(owned[1]).toEqual(owns(1, 2));
    expect(drawn[0].isNew).toBe(false);
  });

  it('marks only the first copy as new when an artwork appears twice in the same draw', () => {
    const { owned, drawn } = addToCollection({}, [artwork(1), artwork(1)], NOW);
    expect(drawn.map((item) => item.isNew)).toEqual([true, false]);
    expect(owned[1].count).toBe(2);
  });

  it('keeps the latest snapshot of each artwork', () => {
    const renamed = { ...artwork(1), title: 'Renamed' };
    const { owned } = addToCollection({ 1: owns(1, 1) }, [renamed], NOW);
    expect(owned[1].artwork.title).toBe('Renamed');
  });

  it('does not modify the previous collection', () => {
    const before: OwnedMap = { 1: owns(1, 1) };
    addToCollection(before, [artwork(1), artwork(2)], NOW);
    expect(before).toEqual({ 1: owns(1, 1) });
  });
});

describe('sortByRarity', () => {
  it('puts the least rare first and the most rare last', () => {
    const { drawn } = addToCollection(
      {},
      [artwork(1, 'legendary'), artwork(2, 'common'), artwork(3, 'rare'), artwork(4, 'uncommon'), artwork(5, 'epic')],
      NOW,
    );
    expect(sortByRarity(drawn).map((item) => item.artwork.rarity)).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
    ]);
  });

  it('keeps the draw order between artworks of the same rarity', () => {
    const { drawn } = addToCollection({}, [artwork(1, 'rare'), artwork(2, 'common'), artwork(3, 'rare')], NOW);
    expect(sortByRarity(drawn).map((item) => item.artwork.id)).toEqual([2, 1, 3]);
  });
});

describe('resellDuplicates', () => {
  const owned: OwnedMap = {
    1: owns(1, 3),
    2: owns(2, 1),
    3: owns(3, 2),
  };

  it('sells the extra copies and always keeps one', () => {
    const result = resellDuplicates(owned, [artwork(1, 'common'), artwork(3, 'legendary')]);
    expect(result.owned[1].count).toBe(1);
    expect(result.owned[3].count).toBe(1);
    expect(result.sold).toBe(2 + 1);
    expect(result.coins).toBe(2 * 5 + 1 * 1000);
  });

  it('ignores artworks with a single copy or not owned', () => {
    const result = resellDuplicates(owned, [artwork(2, 'rare'), artwork(99, 'epic')]);
    expect(result.sold).toBe(0);
    expect(result.coins).toBe(0);
    expect(result.owned[2].count).toBe(1);
  });

  it('only sells the artworks it is given', () => {
    const result = resellDuplicates(owned, [artwork(3, 'rare')]);
    expect(result.owned[1].count).toBe(3);
  });

  it('does not modify the previous collection', () => {
    resellDuplicates(owned, [artwork(1, 'common')]);
    expect(owned[1].count).toBe(3);
  });
});

describe('sellCopies', () => {
  const owned: OwnedMap = {
    1: owns(1, 3),
    2: owns(2, 1),
  };

  it('sells one copy and keeps the others', () => {
    const result = sellCopies(owned, artwork(1, 'rare'), 1);
    expect(result.owned[1].count).toBe(2);
    expect(result.sold).toBe(1);
    expect(result.coins).toBe(50);
  });

  it('can sell the last copy, which leaves the collection', () => {
    const result = sellCopies(owned, artwork(2, 'legendary'), 1);
    expect(result.owned[2]).toBeUndefined();
    expect(result.coins).toBe(1000);
  });

  it('refuses to sell more copies than owned, or an artwork not owned', () => {
    expect(sellCopies(owned, artwork(2, 'common'), 2).sold).toBe(0);
    expect(sellCopies(owned, artwork(99, 'common'), 1).sold).toBe(0);
  });

  it('does not modify the previous collection', () => {
    sellCopies(owned, artwork(2, 'common'), 1);
    expect(owned[2].count).toBe(1);
  });
});
