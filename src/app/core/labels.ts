import { DepartmentId } from './artwork';
import { Rarity } from './game-rules';

export const DEPARTMENT_LABEL: Readonly<Record<DepartmentId, string>> = {
  'european-paintings': 'Peintures européennes',
  'drawings-prints': 'Dessins et estampes',
  'american-wing': 'Aile américaine',
  'european-sculpture': 'Sculpture et arts décoratifs européens',
  'asian-art': 'Art asiatique',
  photographs: 'Photographies',
  'musical-instruments': 'Instruments de musique',
  'greek-roman': 'Art grec et romain',
  'islamic-art': 'Art islamique',
  'egyptian-art': 'Art égyptien',
  'arms-armor': 'Armes et armures',
};

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
