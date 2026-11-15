import { CASE_PRICES } from './game-rules';
import { SHOP_CASES, findShopCase, groupByPrice } from './shop';

describe('SHOP_CASES', () => {
  it('has 12 cases: the classic one and one per sold department', () => {
    expect(SHOP_CASES).toHaveLength(12);
    const departments = SHOP_CASES.map((shopCase) => shopCase.department).filter((department) => department !== null);
    const sold = Object.keys(CASE_PRICES).filter((id) => id !== 'classic');
    expect(new Set(departments)).toEqual(new Set(sold));
  });

  it('makes the classic case draw from every department', () => {
    expect(findShopCase('classic')?.department).toBeNull();
  });
});

describe('findShopCase', () => {
  it('finds a case by its id and ignores unknown ids', () => {
    expect(findShopCase('asian-art')?.department).toBe('asian-art');
    expect(findShopCase('unknown')).toBeUndefined();
  });
});

describe('groupByPrice', () => {
  it('groups the cases by price, cheapest first', () => {
    const groups = groupByPrice(SHOP_CASES);
    expect(groups.map((group) => group.price)).toEqual([150, 250, 400]);
    expect(groups.map((group) => group.cases.length)).toEqual([1, 8, 3]);
  });
});
