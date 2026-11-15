import type { ShopDepartmentId } from './artwork';
import { CASE_PRICES } from './game-rules';
import { DEPARTMENT_LABEL } from './labels';

export type ShopCaseId = 'classic' | ShopDepartmentId;

export interface ShopCase {
  readonly id: ShopCaseId;
  readonly label: string;
  readonly stencil: string;
  readonly price: number;
  readonly department: ShopDepartmentId | null;
}

export interface PriceGroup {
  readonly price: number;
  readonly cases: readonly ShopCase[];
}

const STENCILS: Readonly<Record<ShopCaseId, string>> = {
  classic: 'CLASSIQUE',
  'european-paintings': 'PEINTURES',
  'drawings-prints': 'ESTAMPES',
  'american-wing': 'AMERIQUE',
  'european-sculpture': 'SCULPTURE',
  'asian-art': 'ASIE',
  photographs: 'PHOTOS',
  'musical-instruments': 'MUSIQUE',
  'greek-roman': 'ANTIQUITE',
  'islamic-art': 'ISLAM',
  'egyptian-art': 'EGYPTE',
  'arms-armor': 'ARMURES',
};

export const SHOP_CASES: readonly ShopCase[] = (Object.keys(CASE_PRICES) as ShopCaseId[]).map((id) => ({
  id,
  label: id === 'classic' ? 'Caisse classique' : DEPARTMENT_LABEL[id],
  stencil: STENCILS[id],
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
