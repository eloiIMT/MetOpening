import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { centuryOfYears, decodeIndex, encodeIndex } from './index-format.mjs';

describe('centuryOfYears', () => {
  it('finds the century from the middle of the date range', () => {
    assert.equal(centuryOfYears(1750, 1760), 18);
    assert.equal(centuryOfYears(1801, 1801), 19);
    assert.equal(centuryOfYears(-550, -510), -6);
  });

  it('returns 0 for an unknown or impossible date', () => {
    assert.equal(centuryOfYears(0, 0), 0);
    assert.equal(centuryOfYears(5000, 5100), 0);
    assert.equal(centuryOfYears(Number.NaN, 1800), 0);
  });
});

describe('encodeIndex', () => {
  const rows = [
    { id: 500, tier: 4, department: 'egyptian-art', century: -14 },
    { id: 12, tier: 0, department: 'asian-art', century: 18 },
    { id: 40, tier: 2, department: 'asian-art', century: 0 },
  ];

  it('sorts the works by id and stores the gaps between ids', () => {
    assert.deepEqual(encodeIndex(rows).objectIdDeltas, [12, 28, 460]);
  });

  it('stores one character per work for the tier and the department', () => {
    const file = encodeIndex(rows);
    assert.equal(file.tiers, '024');
    assert.deepEqual(file.departments, ['asian-art', 'egyptian-art']);
    assert.equal(file.departmentCodes, '001');
  });

  it('can be decoded back to the same works', () => {
    assert.deepEqual(
      decodeIndex(encodeIndex(rows)),
      [...rows].sort((a, b) => a.id - b.id),
    );
  });
});
