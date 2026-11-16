import { Injectable, inject } from '@angular/core';
import { Artwork, DepartmentId, isArtwork } from '../artworks/artwork';
import { CardIndexService } from '../artworks/card-index.service';
import { RandomFn, pickRandom } from './draw';
import { RARITIES, Rarity } from './game-rules';
import { MetApiService, isAbortError } from '../met/met-api.service';
import { EMPTY_RESERVE, Reserve, addToReserve, mostNeededRarity, takeFromReserve } from './reserve';

const RESERVE_STORAGE_KEY = 'met-opening.reserve';

const MAX_TRIES = 6;

@Injectable({ providedIn: 'root' })
export class CardSupplyService {
  private readonly cardIndex = inject(CardIndexService);
  private readonly met = inject(MetApiService);

  private reserve: Reserve = readStoredReserve();
  private refilling = false;

  start(): void {
    void this.refill();
  }

  async drawCases(
    cases: readonly (readonly Rarity[])[],
    department: DepartmentId | null,
    random: RandomFn = Math.random,
  ): Promise<Artwork[][]> {
    try {
      return await Promise.all(
        cases.map((rarities) => Promise.all(rarities.map((rarity) => this.draw(rarity, department, random)))),
      );
    } finally {
      void this.refill();
    }
  }

  private draw(rarity: Rarity, department: DepartmentId | null, random: RandomFn): Promise<Artwork> {
    const { reserve, artwork } = takeFromReserve(this.reserve, rarity, department);
    if (artwork) {
      this.saveReserve(reserve);
      return Promise.resolve(artwork);
    }
    return this.fetchRandom(rarity, department, random, true);
  }

  private async fetchRandom(
    rarity: Rarity,
    department: DepartmentId | null,
    random: RandomFn,
    urgent: boolean,
  ): Promise<Artwork> {
    const pool = await this.cardIndex.pool(rarity, department);
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const entry = await this.cardIndex.entry(pickRandom(pool, random));
      const artwork = entry ? await this.met.getArtwork(entry, urgent).catch(skipCancelled) : null;
      if (artwork) {
        return artwork;
      }
    }
    throw new Error(`No playable ${rarity} artwork found`);
  }

  private async refill(): Promise<void> {
    if (this.refilling) {
      return;
    }
    this.refilling = true;
    try {
      for (let rarity = mostNeededRarity(this.reserve); rarity; rarity = mostNeededRarity(this.reserve)) {
        const artwork = await this.fetchRandom(rarity, null, Math.random, false);
        this.saveReserve(addToReserve(this.reserve, artwork));
      }
    } catch {
      return;
    } finally {
      this.refilling = false;
    }
  }

  private saveReserve(reserve: Reserve): void {
    this.reserve = reserve;
    try {
      localStorage.setItem(RESERVE_STORAGE_KEY, JSON.stringify(reserve));
    } catch {
      return;
    }
  }
}

function skipCancelled(error: unknown): null {
  if (isAbortError(error)) {
    return null;
  }
  throw error;
}

function readStoredReserve(): Reserve {
  try {
    const raw = localStorage.getItem(RESERVE_STORAGE_KEY);
    if (raw === null) {
      return EMPTY_RESERVE;
    }
    const parsed = JSON.parse(raw) as Partial<Record<Rarity, unknown>>;
    let reserve = EMPTY_RESERVE;
    for (const rarity of RARITIES) {
      const cards = parsed[rarity];
      for (const card of Array.isArray(cards) ? cards : []) {
        if (isArtwork(card) && card.rarity === rarity) {
          reserve = addToReserve(reserve, card);
        }
      }
    }
    return reserve;
  } catch {
    return EMPTY_RESERVE;
  }
}
