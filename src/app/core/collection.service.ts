import { Injectable, computed, signal } from '@angular/core';
import { Artwork } from './artwork';
import { DrawnArtwork, OwnedEntry, OwnedMap, addToCollection } from './collection-rules';

export const COLLECTION_STORAGE_KEY = 'met-opening.collection';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly entries = signal<OwnedMap>(readStoredCollection());

  readonly owned = this.entries.asReadonly();
  readonly ownedCount = computed(() => Object.keys(this.entries()).length);

  add(artworks: readonly Artwork[]): DrawnArtwork[] {
    const { owned, drawn } = addToCollection(this.entries(), artworks, Date.now());
    this.entries.set(owned);
    saveCollection(owned);
    return drawn;
  }

  countOf(id: number): number {
    return this.entries()[id]?.count ?? 0;
  }
}

function readStoredCollection(): OwnedMap {
  try {
    const raw = localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const result: Record<number, OwnedEntry> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isInteger(id) && isOwnedEntry(value)) {
        result[id] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function isOwnedEntry(value: unknown): value is OwnedEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { count, firstObtainedAt } = value as Partial<OwnedEntry>;
  return (
    typeof count === 'number' &&
    Number.isInteger(count) &&
    count > 0 &&
    typeof firstObtainedAt === 'number' &&
    Number.isFinite(firstObtainedAt)
  );
}

function saveCollection(owned: OwnedMap): void {
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(owned));
  } catch {
    return;
  }
}
