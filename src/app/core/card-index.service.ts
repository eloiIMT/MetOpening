import { Injectable, signal } from '@angular/core';
import { DepartmentId } from './artwork';
import { CardIndex, CardIndexFile, IndexEntry, decodeCardIndex, findEntry, poolIds } from './card-index';
import { Rarity } from './game-rules';

const INDEX_URL = 'data/card-index.json';

@Injectable({ providedIn: 'root' })
export class CardIndexService {
  private loading: Promise<CardIndex> | null = null;
  private readonly pools = new Map<string, readonly number[]>();
  private readonly loaded = signal<CardIndex | null>(null);

  readonly index = this.loaded.asReadonly();

  load(): Promise<CardIndex> {
    if (!this.loading) {
      this.loading = fetchIndex().then((index) => {
        this.loaded.set(index);
        return index;
      });
      this.loading.catch(() => (this.loading = null));
    }
    return this.loading;
  }

  async entry(id: number): Promise<IndexEntry | null> {
    return findEntry(await this.load(), id);
  }

  async pool(rarity: Rarity, department: DepartmentId | null): Promise<readonly number[]> {
    const index = await this.load();
    const key = `${rarity}|${department ?? 'all'}`;
    let ids = this.pools.get(key);
    if (!ids) {
      ids = poolIds(index, rarity, department);
      this.pools.set(key, ids);
    }
    return ids;
  }
}

async function fetchIndex(): Promise<CardIndex> {
  const response = await fetch(INDEX_URL);
  if (!response.ok) {
    throw new Error(`Card index HTTP ${response.status}`);
  }
  return decodeCardIndex((await response.json()) as CardIndexFile);
}
