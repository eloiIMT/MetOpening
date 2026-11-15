import { ARTWORKS_PER_CASE, Rarity, SLOT_ODDS, TOP_SLOT_ODDS } from './game-rules';

export type RandomFn = () => number;
export type TopRarity = keyof typeof TOP_SLOT_ODDS;

export function rollTopRarity(random: RandomFn): TopRarity {
  const roll = random();
  if (roll < TOP_SLOT_ODDS.rare) {
    return 'rare';
  }
  if (roll < 1 - TOP_SLOT_ODDS.legendary) {
    return 'epic';
  }
  return 'legendary';
}

export function rollRarity(random: RandomFn): Rarity {
  const roll = random();
  if (roll < SLOT_ODDS.common) {
    return 'common';
  }
  if (roll < 1 - SLOT_ODDS.top) {
    return 'uncommon';
  }
  return rollTopRarity(random);
}

export function rollCaseRarities(random: RandomFn = Math.random): Rarity[] {
  return Array.from({ length: ARTWORKS_PER_CASE }, () => rollRarity(random));
}

export function pickRandom<T>(items: readonly T[], random: RandomFn): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(random() * items.length)];
}
