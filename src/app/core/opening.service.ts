import { Injectable, inject, signal } from '@angular/core';
import { ArtworkService } from './artwork.service';
import { CollectionService } from './collection.service';
import { DrawnArtwork, sortByRarity } from './collection-rules';
import { drawCases, poolFor } from './draw';
import { StockService } from './stock.service';

export interface OpeningResult {
  readonly stencil: string;
  readonly cases: readonly (readonly DrawnArtwork[])[];
}

@Injectable({ providedIn: 'root' })
export class OpeningService {
  private readonly artworkService = inject(ArtworkService);
  private readonly stockService = inject(StockService);
  private readonly collection = inject(CollectionService);

  private readonly result = signal<OpeningResult | null>(null);
  readonly current = this.result.asReadonly();

  openFreeCases(amount: number): boolean {
    const pool = poolFor(this.artworkService.artworks(), null);
    if (pool.length === 0 || !this.stockService.consume(amount)) {
      return false;
    }
    const cases = drawCases(pool, amount).map((drawnCase) => sortByRarity(this.collection.add(drawnCase)));
    this.result.set({ stencil: 'CLASSIQUE', cases });
    return true;
  }
}
