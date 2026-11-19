import { Artwork, DepartmentId } from './artwork';
import { IndexEntry } from './card-index';
import { centuryMidYear, centuryOf } from './charts';
import { RARITY_RANK, RESALE_VALUE, Rarity } from '../game/game-rules';

export interface BrowserItem extends IndexEntry {
  readonly artwork: Artwork | null;
  readonly copies: number;
  readonly obtainedAt: number | null;
}

export type SortKey = 'rarity' | 'date' | 'obtained' | 'title' | 'artist' | 'copies';
export type SortDirection = 'asc' | 'desc';

export interface BrowseCriteria {
  readonly query: string;
  readonly rarities: ReadonlySet<Rarity>;
  readonly department: DepartmentId | null;
  readonly favorites: ReadonlySet<number> | null;
  readonly sort: SortKey;
  readonly direction: SortDirection;
}

export interface DuplicatesSummary {
  readonly copies: number;
  readonly coins: number;
}

export function itemFromArtwork(artwork: Artwork, copies: number, obtainedAt: number | null): BrowserItem {
  return {
    id: artwork.id,
    rarity: artwork.rarity,
    department: artwork.department,
    century: artwork.year === null ? null : centuryOf(artwork.year).order,
    artwork,
    copies,
    obtainedAt,
  };
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function filterItems(
  items: readonly BrowserItem[],
  criteria: BrowseCriteria,
  ignoreRarity = false,
): BrowserItem[] {
  const needle = normalizeText(criteria.query);
  return items.filter(
    (item) =>
      (needle === '' ||
        (item.artwork !== null &&
          normalizeText(`${item.artwork.title} ${item.artwork.artist ?? ''}`).includes(needle))) &&
      (criteria.department === null || item.department === criteria.department) &&
      (criteria.favorites === null || criteria.favorites.has(item.id)) &&
      (ignoreRarity || criteria.rarities.size === 0 || criteria.rarities.has(item.rarity)),
  );
}

export function browse(items: readonly BrowserItem[], criteria: BrowseCriteria): BrowserItem[] {
  return SORTS[criteria.sort].sort(filterItems(items, criteria), criteria.direction);
}

export function summarizeDuplicates(items: readonly BrowserItem[]): DuplicatesSummary {
  return items.reduce(
    (summary, item) => {
      const extra = Math.max(0, item.copies - 1);
      return { copies: summary.copies + extra, coins: summary.coins + extra * RESALE_VALUE[item.rarity] };
    },
    { copies: 0, coins: 0 },
  );
}

const collator = new Intl.Collator('fr');

/** A sort key read once per item, then compared; missing values (null) go last whatever the direction. */
interface SortEntry<T> {
  readonly item: BrowserItem;
  readonly value: T | null;
  readonly title: string;
}

/** Ties fall back to title A → Z, then Met number; equal titles (often both unknown) skip the collator. */
function byTitle<T>(a: SortEntry<T>, b: SortEntry<T>): number {
  return (a.title === b.title ? 0 : collator.compare(a.title, b.title)) || a.item.id - b.item.id;
}

function sorter<T>(
  valueOf: (item: BrowserItem) => T | null,
  compare: (a: T, b: T) => number,
): (items: BrowserItem[], direction: SortDirection) => BrowserItem[] {
  return (items, direction) => {
    const sign = direction === 'asc' ? 1 : -1;
    return items
      .map((item): SortEntry<T> => ({ item, value: valueOf(item), title: item.artwork?.title ?? '' }))
      .sort((a, b) => {
        if (a.value === null || b.value === null) {
          return Number(a.value === null) - Number(b.value === null) || byTitle(a, b);
        }
        return sign * compare(a.value, b.value) || byTitle(a, b);
      })
      .map((entry) => entry.item);
  };
}

const byNumber = (a: number, b: number) => a - b;
const byText = (a: string, b: string) => collator.compare(a, b);

const SORTS: Readonly<
  Record<SortKey, { readonly sort: ReturnType<typeof sorter>; readonly indexOnly: boolean }>
> = {
  rarity: { sort: sorter((item) => RARITY_RANK[item.rarity], byNumber), indexOnly: true },
  date: {
    sort: sorter(
      (item) => item.artwork?.year ?? (item.century === null ? null : centuryMidYear(item.century)),
      byNumber,
    ),
    indexOnly: true,
  },
  obtained: { sort: sorter((item) => item.obtainedAt, byNumber), indexOnly: false },
  title: { sort: sorter((item) => item.artwork?.title ?? null, byText), indexOnly: false },
  artist: { sort: sorter((item) => item.artwork?.artist ?? null, byText), indexOnly: false },
  copies: { sort: sorter((item) => item.copies, byNumber), indexOnly: false },
};

/** Whether this sort works on index data alone (no artwork loaded), as in the global search. */
export function isIndexSort(key: SortKey): boolean {
  return SORTS[key].indexOnly;
}
