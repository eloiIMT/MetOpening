import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QUOTAS, groupCards } from './card-selection.mjs';

function card(objectID, department, tier, score) {
  return { objectID, department, tier, score };
}

describe('groupCards', () => {
  it('groups the cards by game department and rarity', () => {
    const groups = groupCards([
      card(1, 'Asian Art', 'Commune', 0.1),
      card(2, 'Asian Art', 'Légendaire', 0.9),
      card(3, 'Photographs', 'Commune', 0.2),
    ]);
    assert.deepEqual([...groups.keys()].sort(), ['asian-art|common', 'asian-art|legendary', 'photographs|common']);
  });

  it('ignores the departments that have no case in the game', () => {
    const groups = groupCards([card(1, 'The Costume Institute', 'Rare', 0.5)]);
    assert.equal(groups.size, 0);
  });

  it('puts the best scores first, then the smallest Met id', () => {
    const groups = groupCards([
      card(30, 'Egyptian Art', 'Rare', 0.5),
      card(10, 'Egyptian Art', 'Rare', 0.5),
      card(20, 'Egyptian Art', 'Rare', 0.8),
    ]);
    assert.deepEqual(
      groups.get('egyptian-art|rare').map((item) => item.objectID),
      [20, 10, 30],
    );
  });
});

describe('QUOTAS', () => {
  it('asks for 10 artworks per department', () => {
    assert.equal(
      Object.values(QUOTAS).reduce((sum, count) => sum + count, 0),
      10,
    );
  });
});
