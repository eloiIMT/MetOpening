import { Artwork, DepartmentId } from './artwork';
import { BrowseCriteria, BrowserItem, browse, filterItems, summarizeDuplicates } from './browse';
import { Rarity } from './game-rules';

function item(
  id: number,
  title: string,
  rarity: Rarity,
  options: { artist?: string; department?: DepartmentId; copies?: number; obtainedAt?: number } = {},
): BrowserItem {
  const artwork: Artwork = {
    id,
    title,
    artist: options.artist ?? null,
    date: null,
    department: options.department ?? 'asian-art',
    rarity,
    imageSmall: '',
    image: '',
    metUrl: '',
  };
  return { artwork, copies: options.copies ?? 1, obtainedAt: options.obtainedAt ?? null };
}

const ITEMS: BrowserItem[] = [
  item(1, 'Les Moissonneurs', 'legendary', { artist: 'Pieter Bruegel', obtainedAt: 10, copies: 2 }),
  item(2, 'Armure', 'epic', { department: 'arms-armor', obtainedAt: 30 }),
  item(3, 'Éventail', 'common', { artist: 'Hokusai', obtainedAt: 20, copies: 4 }),
];

const ALL: BrowseCriteria = { query: '', rarities: new Set(), department: null, sort: 'rarity-asc' };

describe('browse', () => {
  it('finds a title without caring about accents or case', () => {
    expect(browse(ITEMS, { ...ALL, query: 'EVENT' }).map((entry) => entry.artwork.id)).toEqual([3]);
  });

  it('also searches in the artist name', () => {
    expect(browse(ITEMS, { ...ALL, query: 'bruegel' }).map((entry) => entry.artwork.id)).toEqual([1]);
  });

  it('keeps only the chosen department', () => {
    expect(browse(ITEMS, { ...ALL, department: 'arms-armor' }).map((entry) => entry.artwork.id)).toEqual([2]);
  });

  it('shows every rarity when none is ticked, and only the ticked ones otherwise', () => {
    expect(browse(ITEMS, ALL)).toHaveLength(3);
    expect(browse(ITEMS, { ...ALL, rarities: new Set<Rarity>(['epic', 'legendary']) })).toHaveLength(2);
  });

  it('sorts by rarity, by date obtained or by title', () => {
    const ids = (sort: BrowseCriteria['sort']) => browse(ITEMS, { ...ALL, sort }).map((entry) => entry.artwork.id);
    expect(ids('rarity-asc')).toEqual([3, 2, 1]);
    expect(ids('rarity-desc')).toEqual([1, 2, 3]);
    expect(ids('recent')).toEqual([2, 3, 1]);
    expect(ids('title')).toEqual([2, 3, 1]);
  });

  it('can ignore the rarity filter to count each rarity', () => {
    const criteria = { ...ALL, rarities: new Set<Rarity>(['epic']) };
    expect(filterItems(ITEMS, criteria, true)).toHaveLength(3);
  });
});

describe('summarizeDuplicates', () => {
  it('counts the extra copies and their resale value', () => {
    expect(summarizeDuplicates(ITEMS)).toEqual({ copies: 1 + 3, coins: 1 * 1000 + 3 * 5 });
  });
});
