import { Rarity } from './game-rules';

export type DepartmentId =
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

export interface Artwork {
  readonly id: number;
  readonly title: string;
  readonly artist: string | null;
  readonly date: string | null;
  readonly department: DepartmentId;
  readonly rarity: Rarity;
  readonly imageSmall: string;
  readonly image: string;
  readonly metUrl: string;
}