import { Inventory, addCases, countCases, removeCases } from './inventory-rules';

describe('inventory rules', () => {
  it('counts zero for a case type never bought', () => {
    expect(countCases({}, 'asian-art')).toBe(0);
  });

  it('adds bought cases', () => {
    const inventory = addCases(addCases({}, 'asian-art'), 'asian-art', 2);
    expect(countCases(inventory, 'asian-art')).toBe(3);
  });

  it('removes opened cases and forgets a type once empty', () => {
    const inventory: Inventory = { 'asian-art': 3, photographs: 1 };
    expect(removeCases(inventory, 'asian-art', 2)).toEqual({ 'asian-art': 1, photographs: 1 });
    expect(removeCases(inventory, 'photographs', 1)).toEqual({ 'asian-art': 3 });
  });

  it('refuses to open more cases than owned, or a wrong amount', () => {
    const inventory: Inventory = { 'asian-art': 1 };
    expect(removeCases(inventory, 'asian-art', 2)).toBeNull();
    expect(removeCases(inventory, 'egyptian-art', 1)).toBeNull();
    expect(removeCases(inventory, 'asian-art', 0)).toBeNull();
  });

  it('does not modify the previous inventory', () => {
    const inventory: Inventory = { 'asian-art': 2 };
    addCases(inventory, 'asian-art');
    removeCases(inventory, 'asian-art', 1);
    expect(inventory).toEqual({ 'asian-art': 2 });
  });
});
