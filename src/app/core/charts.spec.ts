import { Artwork, DepartmentId } from './artwork';
import { itemFromArtwork } from './browse';
import { centuryFromOrder, centuryOf, centuryRows, departmentRows, pieSlicePath, rarityRows } from './charts';
import { Rarity } from './game-rules';

function artwork(id: number, rarity: Rarity, department: DepartmentId, year: number | null): Artwork {
  return { id, title: `Artwork ${id}`, artist: null, date: null, year, department, rarity, imageSmall: '', image: '', metUrl: '' };
}

const ARTWORKS = [
  artwork(1, 'common', 'asian-art', 1750),
  artwork(2, 'common', 'asian-art', 1799),
  artwork(3, 'legendary', 'egyptian-art', -1350),
  artwork(4, 'rare', 'asian-art', 1801),
  artwork(5, 'rare', 'photographs', null),
].map((item) => itemFromArtwork(item, 1, null));

describe('centuryOf', () => {
  it('finds the century of a year of our era', () => {
    expect(centuryOf(1750)).toEqual({ order: 18, number: 18, beforeCommonEra: false });
    expect(centuryOf(1801)).toEqual({ order: 19, number: 19, beforeCommonEra: false });
  });

  it('finds the century of a year before our era', () => {
    expect(centuryOf(-530)).toEqual({ order: -6, number: 6, beforeCommonEra: true });
  });
});

describe('centuryFromOrder', () => {
  it('gives back the century found by centuryOf', () => {
    expect(centuryFromOrder(centuryOf(1750).order)).toEqual(centuryOf(1750));
    expect(centuryFromOrder(centuryOf(-530).order)).toEqual(centuryOf(-530));
  });
});

describe('rarityRows', () => {
  it('counts each rarity from the least rare to the most rare and skips empty ones', () => {
    expect(rarityRows(ARTWORKS).map((row) => [row.key, row.value])).toEqual([
      ['common', 2],
      ['rare', 2],
      ['legendary', 1],
    ]);
  });

  it('gives each row its share of the total', () => {
    expect(rarityRows(ARTWORKS)[0].share).toBeCloseTo(0.4);
  });
});

describe('departmentRows', () => {
  it('sorts the departments from the biggest to the smallest', () => {
    expect(departmentRows(ARTWORKS).map((row) => [row.key, row.value])).toEqual([
      ['asian-art', 3],
      ['egyptian-art', 1],
      ['photographs', 1],
    ]);
  });
});

describe('centuryRows', () => {
  it('orders the centuries in time and ignores artworks without a year', () => {
    expect(centuryRows(ARTWORKS).map((row) => [row.key.order, row.value])).toEqual([
      [-14, 1],
      [18, 2],
      [19, 1],
    ]);
  });
});

describe('pieSlicePath', () => {
  it('draws a quarter slice from the top, clockwise', () => {
    expect(pieSlicePath(0, 0.25)).toBe('M 100 100 L 100 4 A 96 96 0 0 1 196 100 Z');
  });

  it('uses the large arc for a slice bigger than half', () => {
    expect(pieSlicePath(0, 0.75)).toContain('A 96 96 0 1 1');
  });

  it('draws a full circle when one slice takes everything', () => {
    expect(pieSlicePath(0, 1)).toBe('M 100 4 A 96 96 0 1 1 100 196 A 96 96 0 1 1 100 4 Z');
  });
});
