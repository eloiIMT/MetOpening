import { Injectable, computed, inject, signal } from '@angular/core';
import { Artwork, isArtwork } from '../artworks/artwork';
import { CardIndexService } from '../artworks/card-index.service';
import {
  DrawnArtwork,
  OwnedEntry,
  OwnedMap,
  ResaleResult,
  addToCollection,
  resellDuplicates,
  sellCopies,
} from './collection-rules';
import { MetApiService } from '../met/met-api.service';
import { WalletService } from '../economy/wallet.service';

export const COLLECTION_STORAGE_KEY = 'met-opening.collection';

type LegacyEntry = Omit<OwnedEntry, 'artwork'>;

interface StoredCollection {
  readonly owned: OwnedMap;
  readonly legacy: Record<number, LegacyEntry>;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly wallet = inject(WalletService);
  private readonly cardIndex = inject(CardIndexService);
  private readonly met = inject(MetApiService);
  private readonly stored = readStoredCollection();
  private readonly entries = signal<OwnedMap>(this.stored.owned);
  private readonly legacy = this.stored.legacy;

  readonly owned = this.entries.asReadonly();
  readonly ownedCount = computed(() => Object.keys(this.entries()).length);

  constructor() {
    if (Object.keys(this.legacy).length > 0) {
      void this.convertLegacy();
    }
  }

  add(artworks: readonly Artwork[]): DrawnArtwork[] {
    const current: Record<number, OwnedEntry> = { ...this.entries() };
    for (const artwork of artworks) {
      const old = this.legacy[artwork.id];
      if (old) {
        current[artwork.id] = { ...old, artwork };
        delete this.legacy[artwork.id];
      }
    }
    const { owned, drawn } = addToCollection(current, artworks, Date.now());
    this.save(owned);
    return drawn;
  }

  sellCopy(artwork: Artwork): ResaleResult {
    return this.applySale(sellCopies(this.entries(), artwork, 1));
  }

  sellDuplicates(artworks: readonly Artwork[]): ResaleResult {
    return this.applySale(resellDuplicates(this.entries(), artworks));
  }

  private applySale(result: ResaleResult): ResaleResult {
    if (result.sold > 0) {
      this.save(result.owned);
      this.wallet.credit(result.coins);
    }
    return result;
  }

  private save(owned: OwnedMap): void {
    this.entries.set(owned);
    try {
      localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify({ ...this.legacy, ...owned }));
    } catch {
      return;
    }
  }

  private async convertLegacy(): Promise<void> {
    for (const [key, entry] of Object.entries(this.legacy)) {
      const id = Number(key);
      const artwork = await this.fetchArtwork(id);
      if (artwork && this.legacy[id]) {
        delete this.legacy[id];
        this.save({ ...this.entries(), [id]: { ...entry, artwork } });
      }
    }
  }

  private async fetchArtwork(id: number): Promise<Artwork | null> {
    try {
      const entry = await this.cardIndex.entry(id);
      return entry ? await this.met.getArtwork(entry) : null;
    } catch {
      return null;
    }
  }

  countOf(id: number): number {
    return this.entries()[id]?.count ?? 0;
  }
}

function readStoredCollection(): StoredCollection {
  const owned: Record<number, OwnedEntry> = {};
  const legacy: Record<number, LegacyEntry> = {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COLLECTION_STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) {
      return { owned, legacy };
    }
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (!Number.isInteger(id) || !isLegacyEntry(value)) {
        continue;
      }
      const { artwork } = value as Partial<OwnedEntry>;
      if (isArtwork(artwork) && artwork.id === id) {
        owned[id] = { count: value.count, firstObtainedAt: value.firstObtainedAt, artwork };
      } else {
        legacy[id] = { count: value.count, firstObtainedAt: value.firstObtainedAt };
      }
    }
  } catch {
    return { owned, legacy };
  }
  return { owned, legacy };
}

function isLegacyEntry(value: unknown): value is LegacyEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { count, firstObtainedAt } = value as Partial<LegacyEntry>;
  return (
    typeof count === 'number' &&
    Number.isInteger(count) &&
    count > 0 &&
    typeof firstObtainedAt === 'number' &&
    Number.isFinite(firstObtainedAt)
  );
}
