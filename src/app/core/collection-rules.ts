import { Artwork } from './artwork';
import { RARITY_RANK, RESALE_VALUE } from './game-rules';

export interface OwnedEntry {
  readonly count: number;
  readonly firstObtainedAt: number;
  readonly artwork: Artwork;
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
    next[artwork.id] = entry ? { ...entry, count: entry.count + 1, artwork } : { count: 1, firstObtainedAt: now, artwork };
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

export function sellCopies(owned: OwnedMap, artwork: Artwork, amount: number): ResaleResult {
  const entry: OwnedEntry | undefined = owned[artwork.id];
  if (!entry || !Number.isInteger(amount) || amount <= 0 || amount > entry.count) {
    return { owned, sold: 0, coins: 0 };
  }
  const next: Record<number, OwnedEntry> = { ...owned };
  if (amount === entry.count) {
    delete next[artwork.id];
  } else {
    next[artwork.id] = { ...entry, count: entry.count - amount };
  }
  return { owned: next, sold: amount, coins: amount * RESALE_VALUE[artwork.rarity] };
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
