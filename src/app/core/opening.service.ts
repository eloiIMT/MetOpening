import { Injectable, inject, signal } from '@angular/core';
import { ArtworkService } from './artwork.service';
import { CollectionService } from './collection.service';
import { DrawnArtwork, sortByRarity } from './collection-rules';
import { drawCases, poolFor } from './draw';
import { StockService } from './stock.service';

export const OPENING_STORAGE_KEY = 'met-opening.last-opening';

export interface OpeningResult {
  readonly stencil: string;
  readonly cases: readonly (readonly DrawnArtwork[])[];
}

@Injectable({ providedIn: 'root' })
export class OpeningService {
  private readonly artworkService = inject(ArtworkService);
  private readonly stockService = inject(StockService);
  private readonly collection = inject(CollectionService);

  private readonly result = signal<OpeningResult | null>(readStoredOpening());
  readonly current = this.result.asReadonly();

  openFreeCases(amount: number): boolean {
    const pool = poolFor(this.artworkService.artworks(), null);
    if (pool.length === 0 || !this.stockService.consume(amount)) {
      return false;
    }
    const cases = drawCases(pool, amount).map((drawnCase) => sortByRarity(this.collection.add(drawnCase)));
    const result: OpeningResult = { stencil: 'CLASSIQUE', cases };
    this.result.set(result);
    saveOpening(result);
    return true;
  }
}

function readStoredOpening(): OpeningResult | null {
  try {
    const raw = sessionStorage.getItem(OPENING_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isOpeningResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isOpeningResult(value: unknown): value is OpeningResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { stencil, cases } = value as Partial<OpeningResult>;
  return typeof stencil === 'string' && Array.isArray(cases) && cases.every((drawnCase) => Array.isArray(drawnCase));
}

function saveOpening(result: OpeningResult): void {
  try {
    sessionStorage.setItem(OPENING_STORAGE_KEY, JSON.stringify(result));
  } catch {
    return;
  }
}
