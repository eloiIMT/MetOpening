import { Injectable, inject, signal } from '@angular/core';
import { Artwork, DepartmentId } from './artwork';
import { CardSupplyService } from './card-supply.service';
import { CollectionService } from './collection.service';
import { DrawnArtwork, sortByRarity } from './collection-rules';
import { rollCaseRarities } from './draw';
import { InventoryService } from './inventory.service';
import { ShopCase, ShopCaseId, findShopCase } from './shop';
import { StockService } from './stock.service';

export const OPENING_STORAGE_KEY = 'met-opening.last-opening';

export interface OpeningResult {
  readonly caseId: ShopCaseId;
  readonly cases: readonly (readonly DrawnArtwork[])[];
}

@Injectable({ providedIn: 'root' })
export class OpeningService {
  private readonly supply = inject(CardSupplyService);
  private readonly stockService = inject(StockService);
  private readonly collection = inject(CollectionService);
  private readonly inventory = inject(InventoryService);

  private readonly result = signal<OpeningResult | null>(readStoredOpening());
  private readonly preparingState = signal(false);

  readonly current = this.result.asReadonly();
  readonly preparing = this.preparingState.asReadonly();

  openFreeCases(amount: number): Promise<boolean> {
    return this.open('classic', null, amount, {
      canPay: () => this.stockService.canConsume(amount),
      pay: () => this.stockService.consume(amount),
    });
  }

  openBoughtCases(shopCase: ShopCase, amount: number): Promise<boolean> {
    return this.open(shopCase.id, shopCase.department, amount, {
      canPay: () => this.inventory.countOf(shopCase.id) >= amount,
      pay: () => this.inventory.consume(shopCase.id, amount),
    });
  }

  private async open(
    caseId: ShopCaseId,
    department: DepartmentId | null,
    amount: number,
    payment: { canPay: () => boolean; pay: () => boolean },
  ): Promise<boolean> {
    if (this.preparingState() || amount <= 0 || !payment.canPay()) {
      return false;
    }
    this.preparingState.set(true);
    try {
      const rarities = Array.from({ length: amount }, () => rollCaseRarities());
      const drawnCases = await this.supply.drawCases(rarities, department);
      if (!payment.pay()) {
        return false;
      }
      this.finishOpening(caseId, drawnCases);
      return true;
    } finally {
      this.preparingState.set(false);
    }
  }

  private finishOpening(caseId: ShopCaseId, drawnCases: readonly Artwork[][]): void {
    const cases = drawnCases.map((drawnCase) => sortByRarity(this.collection.add(drawnCase)));
    const result: OpeningResult = { caseId, cases };
    this.result.set(result);
    saveOpening(result);
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
  const { caseId, cases } = value as Partial<OpeningResult>;
  return typeof caseId === 'string' && findShopCase(caseId) !== undefined && Array.isArray(cases) && cases.every((drawnCase) => Array.isArray(drawnCase));
}

function saveOpening(result: OpeningResult): void {
  try {
    sessionStorage.setItem(OPENING_STORAGE_KEY, JSON.stringify(result));
  } catch {
    return;
  }
}
