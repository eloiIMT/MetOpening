import { Rarity } from './game-rules';

export const RARITY_LABEL: Readonly<Record<Rarity, string>> = {
  common: 'Commune',
  uncommon: 'Peu commune',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};
