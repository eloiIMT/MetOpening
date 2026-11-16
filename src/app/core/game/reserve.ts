import { Artwork, DepartmentId } from '../artworks/artwork';
import { RARITIES, Rarity } from './game-rules';

export type Reserve = Readonly<Record<Rarity, readonly Artwork[]>>;

export const RESERVE_TARGET: Readonly<Record<Rarity, number>> = {
  common: 25,
  uncommon: 15,
  rare: 8,
  epic: 2,
  legendary: 1,
};

export const EMPTY_RESERVE: Reserve = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };

export interface ReserveTake {
  readonly reserve: Reserve;
  readonly artwork: Artwork | null;
}

export function takeFromReserve(reserve: Reserve, rarity: Rarity, department: DepartmentId | null): ReserveTake {
  const cards = reserve[rarity];
  const position = cards.findIndex((artwork) => department === null || artwork.department === department);
  if (position === -1) {
    return { reserve, artwork: null };
  }
  return {
    reserve: { ...reserve, [rarity]: cards.filter((_, index) => index !== position) },
    artwork: cards[position],
  };
}

export function addToReserve(reserve: Reserve, artwork: Artwork): Reserve {
  const cards = reserve[artwork.rarity];
  if (cards.some((card) => card.id === artwork.id) || cards.length >= RESERVE_TARGET[artwork.rarity]) {
    return reserve;
  }
  return { ...reserve, [artwork.rarity]: [...cards, artwork] };
}

export function mostNeededRarity(reserve: Reserve): Rarity | null {
  let needed: Rarity | null = null;
  let lowestFill = 1;
  for (const rarity of RARITIES) {
    const fill = reserve[rarity].length / RESERVE_TARGET[rarity];
    if (fill < lowestFill) {
      lowestFill = fill;
      needed = rarity;
    }
  }
  return needed;
}
