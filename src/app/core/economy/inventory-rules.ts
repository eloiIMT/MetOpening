import { ShopCaseId } from './shop';

export type Inventory = Readonly<Partial<Record<ShopCaseId, number>>>;

export function countCases(inventory: Inventory, id: ShopCaseId): number {
  return inventory[id] ?? 0;
}

export function addCases(inventory: Inventory, id: ShopCaseId, amount = 1): Inventory {
  if (!Number.isInteger(amount) || amount <= 0) {
    return inventory;
  }
  return { ...inventory, [id]: countCases(inventory, id) + amount };
}

export function removeCases(inventory: Inventory, id: ShopCaseId, amount: number): Inventory | null {
  const owned = countCases(inventory, id);
  if (!Number.isInteger(amount) || amount <= 0 || amount > owned) {
    return null;
  }
  const next: Partial<Record<ShopCaseId, number>> = { ...inventory };
  if (owned === amount) {
    delete next[id];
  } else {
    next[id] = owned - amount;
  }
  return next;
}
