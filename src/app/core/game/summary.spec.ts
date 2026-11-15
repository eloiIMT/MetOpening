import { Artwork } from '../artworks/artwork';
import { DrawnArtwork } from '../collection/collection-rules';
import { Rarity } from './game-rules';
import { summarizeOpening } from './summary';

function drawn(id: number, rarity: Rarity, isNew = true): DrawnArtwork {
  const artwork: Artwork = {
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
  return { artwork, isNew };
}

describe('summarizeOpening', () => {
  it('groups the copies of the same artwork', () => {
    const recap = summarizeOpening([drawn(1, 'common', true), drawn(1, 'common', false), drawn(2, 'rare')]);
    expect(recap.items.map((item) => [item.artwork.id, item.copies])).toEqual([
      [1, 2],
      [2, 1],
    ]);
  });

  it('keeps an artwork new when one of its copies is new', () => {
    const recap = summarizeOpening([drawn(1, 'common', true), drawn(1, 'common', false)]);
    expect(recap.items[0].isNew).toBe(true);
  });

  it('sorts the artworks from the least rare to the most rare', () => {
    const recap = summarizeOpening([drawn(1, 'legendary'), drawn(2, 'common'), drawn(3, 'epic')]);
    expect(recap.items.map((item) => item.artwork.rarity)).toEqual(['common', 'epic', 'legendary']);
  });

  it('counts each rarity and skips the missing ones', () => {
    const recap = summarizeOpening([drawn(1, 'common'), drawn(2, 'common'), drawn(3, 'rare')]);
    expect(recap.tally).toEqual([
      { rarity: 'common', count: 2 },
      { rarity: 'rare', count: 1 },
    ]);
  });

  it('adds up the resale value of every copy', () => {
    const recap = summarizeOpening([drawn(1, 'common'), drawn(1, 'common', false), drawn(2, 'legendary')]);
    expect(recap.total).toBe(3);
    expect(recap.value).toBe(5 + 5 + 1000);
  });
});
