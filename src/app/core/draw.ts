import { Artwork, DepartmentId } from './artwork';
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

export function pickRandom<T>(items: readonly T[], random: RandomFn): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(random() * items.length)];
}

export function poolFor(artworks: readonly Artwork[], department: DepartmentId | null): Artwork[] {
  return department === null ? [...artworks] : artworks.filter((artwork) => artwork.department === department);
}

export function drawCase(pool: readonly Artwork[], random: RandomFn = Math.random): Artwork[] {
  return Array.from({ length: ARTWORKS_PER_CASE }, () => pickArtwork(pool, rollRarity(random), random));
}

export function drawCases(pool: readonly Artwork[], count: number, random: RandomFn = Math.random): Artwork[][] {
  return Array.from({ length: count }, () => drawCase(pool, random));
}

function pickArtwork(pool: readonly Artwork[], rarity: Rarity, random: RandomFn): Artwork {
  const candidates = pool.filter((artwork) => artwork.rarity === rarity);
  return pickRandom(candidates.length > 0 ? candidates : pool, random);
}