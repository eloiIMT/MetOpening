import { Artwork } from './artwork';
import { OwnedMap, addToCollection, sortByRarity } from './collection-rules';
import { Rarity } from './game-rules';

function artwork(id: number, rarity: Rarity = 'common'): Artwork {
  return {
    id,
    title: `Artwork ${id}`,
    artist: null,
    date: null,
    department: 'asian-art',
    rarity,
    imageSmall: '',
    image: '',
    metUrl: '',
  };
}

const NOW = 1_000_000;

describe('addToCollection', () => {
  it('adds a new artwork with one copy', () => {
    const { owned, drawn } = addToCollection({}, [artwork(1)], NOW);
    expect(owned[1]).toEqual({ count: 1, firstObtainedAt: NOW });
    expect(drawn[0].isNew).toBe(true);
  });

  it('counts a second copy as a duplicate', () => {
    const before: OwnedMap = { 1: { count: 1, firstObtainedAt: NOW } };
    const { owned, drawn } = addToCollection(before, [artwork(1)], NOW + 500);
    expect(owned[1]).toEqual({ count: 2, firstObtainedAt: NOW });
    expect(drawn[0].isNew).toBe(false);
  });

  it('marks only the first copy as new when an artwork appears twice in the same draw', () => {
    const { owned, drawn } = addToCollection({}, [artwork(1), artwork(1)], NOW);
    expect(drawn.map((item) => item.isNew)).toEqual([true, false]);
    expect(owned[1].count).toBe(2);
  });

  it('does not modify the previous collection', () => {
    const before: OwnedMap = { 1: { count: 1, firstObtainedAt: NOW } };
    addToCollection(before, [artwork(1), artwork(2)], NOW);
    expect(before).toEqual({ 1: { count: 1, firstObtainedAt: NOW } });
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
