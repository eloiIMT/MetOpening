import { Artwork } from './artwork';
import { RARITY_RANK } from './game-rules';

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
