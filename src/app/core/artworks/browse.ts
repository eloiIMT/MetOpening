import { Artwork, DepartmentId } from './artwork';
import { IndexEntry } from './card-index';
import { centuryOf } from './charts';
import { RARITY_RANK, RESALE_VALUE, Rarity } from '../game/game-rules';

export interface BrowserItem extends IndexEntry {
  readonly artwork: Artwork | null;
  readonly copies: number;
  readonly obtainedAt: number | null;
}

export type SortId = 'rarity-asc' | 'rarity-desc' | 'recent' | 'title';

export interface BrowseCriteria {
  readonly query: string;
  readonly rarities: ReadonlySet<Rarity>;
  readonly department: DepartmentId | null;
  readonly sort: SortId;
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

export function normalizeText(text: string): string {
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
      (ignoreRarity || criteria.rarities.size === 0 || criteria.rarities.has(item.rarity)),
  );
}

export function browse(items: readonly BrowserItem[], criteria: BrowseCriteria): BrowserItem[] {
  return filterItems(items, criteria).sort(COMPARATORS[criteria.sort]);
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

function byTitle(a: BrowserItem, b: BrowserItem): number {
  const first = a.artwork?.title ?? '';
  const second = b.artwork?.title ?? '';
  return (first === second ? 0 : collator.compare(first, second)) || a.id - b.id;
}

const COMPARATORS: Readonly<Record<SortId, (a: BrowserItem, b: BrowserItem) => number>> = {
  'rarity-asc': (a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] || byTitle(a, b),
  'rarity-desc': (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || byTitle(a, b),
  recent: (a, b) => (b.obtainedAt ?? 0) - (a.obtainedAt ?? 0) || byTitle(a, b),
  title: byTitle,
};
