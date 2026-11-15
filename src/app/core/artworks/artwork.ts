import { Rarity } from '../game/game-rules';

export type ShopDepartmentId =
  | 'european-paintings'
  | 'drawings-prints'
  | 'american-wing'
  | 'european-sculpture'
  | 'asian-art'
  | 'photographs'
  | 'musical-instruments'
  | 'greek-roman'
  | 'islamic-art'
  | 'egyptian-art'
  | 'arms-armor';

export type DepartmentId =
  | ShopDepartmentId
  | 'ancient-west-asian'
  | 'africa-oceania-americas'
  | 'cloisters'
  | 'costume-institute'
  | 'libraries'
  | 'medieval-art'
  | 'modern-contemporary'
  | 'robert-lehman';

export interface Artwork {
  readonly id: number;
  readonly title: string;
  readonly artist: string | null;
  readonly date: string | null;
  readonly year: number | null;
  readonly department: DepartmentId;
  readonly rarity: Rarity;
  readonly imageSmall: string;
  readonly image: string;
  readonly metUrl: string;
}
const RARITIES: readonly string[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function isArtwork(value: unknown): value is Artwork {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const artwork = value as Partial<Record<keyof Artwork, unknown>>;
  return (
    typeof artwork.id === 'number' &&
    Number.isInteger(artwork.id) &&
    typeof artwork.title === 'string' &&
    typeof artwork.department === 'string' &&
    typeof artwork.rarity === 'string' &&
    RARITIES.includes(artwork.rarity) &&
    typeof artwork.imageSmall === 'string' &&
    typeof artwork.image === 'string' &&
    typeof artwork.metUrl === 'string'
  );
}
