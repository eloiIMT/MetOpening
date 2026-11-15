import type { ShopDepartmentId } from './artwork';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_RANK: Readonly<Record<Rarity, number>> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const STARTING_COINS = 320;

export const STOCK_MAX = 10;
export const STOCK_REFILL_MS = 3 * 60 * 1000;

export const OPEN_AMOUNTS = [1, 5, 10] as const;
export type OpenAmount = (typeof OPEN_AMOUNTS)[number];

export const ARTWORKS_PER_CASE = 5;

export const SLOT_ODDS: Readonly<Record<'common' | 'uncommon' | 'top', number>> = {
  common: 0.5,
  uncommon: 0.3,
  top: 0.2,
};

export const TOP_SLOT_ODDS: Readonly<Record<'rare' | 'epic' | 'legendary', number>> = {
  rare: 0.8,
  epic: 0.17,
  legendary: 0.03,
};

export const RESALE_VALUE: Readonly<Record<Rarity, number>> = {
  common: 5,
  uncommon: 10,
  rare: 50,
  epic: 200,
  legendary: 1000,
};

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