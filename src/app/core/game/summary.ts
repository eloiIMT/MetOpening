import { Artwork } from '../artworks/artwork';
import { DrawnArtwork } from '../collection/collection-rules';
import { RARITIES, RARITY_RANK, RESALE_VALUE, Rarity } from './game-rules';

export interface SummaryItem {
  readonly artwork: Artwork;
  readonly copies: number;
  readonly isNew: boolean;
}

export interface RarityCount {
  readonly rarity: Rarity;
  readonly count: number;
}

export interface OpeningRecap {
  readonly total: number;
  readonly value: number;
  readonly tally: readonly RarityCount[];
  readonly items: readonly SummaryItem[];
}

export function summarizeOpening(drawn: readonly DrawnArtwork[]): OpeningRecap {
  const grouped = new Map<number, SummaryItem>();
  for (const { artwork, isNew } of drawn) {
    const existing = grouped.get(artwork.id);
    grouped.set(
      artwork.id,
      existing
        ? { ...existing, copies: existing.copies + 1, isNew: existing.isNew || isNew }
        : { artwork, copies: 1, isNew },
    );
  }
  const items = [...grouped.values()].sort((a, b) => RARITY_RANK[a.artwork.rarity] - RARITY_RANK[b.artwork.rarity]);
  const tally = RARITIES.map((rarity) => ({
    rarity,
    count: drawn.filter((item) => item.artwork.rarity === rarity).length,
  })).filter((entry) => entry.count > 0);
  const value = drawn.reduce((sum, item) => sum + RESALE_VALUE[item.artwork.rarity], 0);
  return { total: drawn.length, value, tally, items };
}
