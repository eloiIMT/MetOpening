import { Injectable, inject, signal } from '@angular/core';
import { Inventory, addCases, countCases, removeCases } from './inventory-rules';
import { SHOP_CASES, ShopCase, ShopCaseId } from './shop';
import { WalletService } from './wallet.service';

export const INVENTORY_STORAGE_KEY = 'met-opening.inventory';

const SHOP_CASE_IDS = new Set<string>(SHOP_CASES.map((shopCase) => shopCase.id));

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly wallet = inject(WalletService);
  private readonly state = signal<Inventory>(readStoredInventory());

  readonly inventory = this.state.asReadonly();

  countOf(id: ShopCaseId): number {
    return countCases(this.state(), id);
  }

  buy(shopCase: ShopCase): boolean {
    if (!this.wallet.debit(shopCase.price)) {
      return false;
    }
    this.save(addCases(this.state(), shopCase.id));
    return true;
  }

  consume(id: ShopCaseId, amount: number): boolean {
    const next = removeCases(this.state(), id, amount);
    if (next === null) {
      return false;
    }
    this.save(next);
    return true;
  }

  private save(inventory: Inventory): void {
    this.state.set(inventory);
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch {
      return;
    }
  }
}

function readStoredInventory(): Inventory {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const result: Partial<Record<ShopCaseId, number>> = {};
    for (const [id, count] of Object.entries(parsed)) {
      if (SHOP_CASE_IDS.has(id) && typeof count === 'number' && Number.isInteger(count) && count > 0) {
        result[id as ShopCaseId] = count;
      }
    }
    return result;
  } catch {
    return {};
  }
}
