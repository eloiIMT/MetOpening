import type { ShopDepartmentId } from '../artworks/artwork';

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

export const CASE_PRICES: Readonly<Record<'classic' | ShopDepartmentId, number>> = {
  classic: 150,
  'european-paintings': 400,
  'drawings-prints': 400,
  'american-wing': 400,
  'european-sculpture': 250,
  'asian-art': 250,
  photographs: 250,
  'musical-instruments': 250,
  'greek-roman': 250,
  'islamic-art': 250,
  'egyptian-art': 250,
  'arms-armor': 250,
};

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
