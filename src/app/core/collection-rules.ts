import { Artwork } from './artwork';
import { RARITY_RANK, RESALE_VALUE } from './game-rules';

export interface OwnedEntry {
  readonly count: number;
  readonly firstObtainedAt: number;
}

export type OwnedMap = Readonly<Record<number, OwnedEntry>>;

export interface DrawnArtwork {
  readonly artwork: Artwork;
  readonly isNew: boolean;
}

export interface CollectionUpdate {
  readonly owned: OwnedMap;
  readonly drawn: DrawnArtwork[];
}

export function addToCollection(owned: OwnedMap, artworks: readonly Artwork[], now: number): CollectionUpdate {
  const next: Record<number, OwnedEntry> = { ...owned };
  const drawn = artworks.map((artwork) => {
    const entry: OwnedEntry | undefined = next[artwork.id];
    next[artwork.id] = entry ? { ...entry, count: entry.count + 1 } : { count: 1, firstObtainedAt: now };
    return { artwork, isNew: entry === undefined };
  });
  return { owned: next, drawn };
}

export function sortByRarity(drawn: readonly DrawnArtwork[]): DrawnArtwork[] {
  return [...drawn].sort((a, b) => RARITY_RANK[a.artwork.rarity] - RARITY_RANK[b.artwork.rarity]);
}

export interface ResaleResult {
  readonly owned: OwnedMap;
  readonly sold: number;
  readonly coins: number;
}

export function resellDuplicates(owned: OwnedMap, artworks: readonly Artwork[]): ResaleResult {
  const next: Record<number, OwnedEntry> = { ...owned };
  let sold = 0;
  let coins = 0;
  for (const artwork of artworks) {
    const entry: OwnedEntry | undefined = next[artwork.id];
    if (!entry || entry.count <= 1) {
      continue;
    }
    const extra = entry.count - 1;
    sold += extra;
    coins += extra * RESALE_VALUE[artwork.rarity];
    next[artwork.id] = { ...entry, count: 1 };
  }
  return { owned: next, sold, coins };
}
