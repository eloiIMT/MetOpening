import type { ShopDepartmentId } from '../artworks/artwork';
import { CASE_PRICES } from '../game/game-rules';

export type ShopCaseId = 'classic' | ShopDepartmentId;

export interface ShopCase {
  readonly id: ShopCaseId;
  readonly price: number;
  readonly department: ShopDepartmentId | null;
}

export interface PriceGroup {
  readonly price: number;
  readonly cases: readonly ShopCase[];
}

export const SHOP_CASES: readonly ShopCase[] = (Object.keys(CASE_PRICES) as ShopCaseId[]).map((id) => ({
  id,
  price: CASE_PRICES[id],
  department: id === 'classic' ? null : id,
}));

export function findShopCase(id: string): ShopCase | undefined {
  return SHOP_CASES.find((shopCase) => shopCase.id === id);
}

export function groupByPrice(cases: readonly ShopCase[]): PriceGroup[] {
  const prices = [...new Set(cases.map((shopCase) => shopCase.price))].sort((a, b) => a - b);
  return prices.map((price) => ({ price, cases: cases.filter((shopCase) => shopCase.price === price) }));
}
