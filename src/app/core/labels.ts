import { Rarity } from './game-rules';

export const RARITY_LABEL: Readonly<Record<Rarity, string>> = {
  common: 'Commune',
  uncommon: 'Peu commune',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export const RARITY_LABEL_PLURAL: Readonly<Record<Rarity, string>> = {
  common: 'Communes',
  uncommon: 'Peu communes',
  rare: 'Rares',
  epic: 'Épiques',
  legendary: 'Légendaires',
};

export function formatCount(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString('fr-FR')} ${count > 1 ? plural : singular}`;
}

export function formatCoins(amount: number): string {
  return formatCount(amount, 'pièce', 'pièces');
}
