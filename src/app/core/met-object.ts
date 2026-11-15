import { Artwork } from './artwork';
import { IndexEntry } from './card-index';

export interface MetObject {
  readonly objectID: number;
  readonly title?: string;
  readonly artistDisplayName?: string;
  readonly objectDate?: string;
  readonly objectBeginDate?: number;
  readonly objectEndDate?: number;
  readonly isPublicDomain?: boolean;
  readonly primaryImage?: string;
  readonly primaryImageSmall?: string;
  readonly objectURL?: string;
}

export interface MetSearchResult {
  readonly total: number;
  readonly objectIDs: readonly number[] | null;
}

export function yearOf(object: MetObject): number | null {
  const { objectBeginDate: begin, objectEndDate: end } = object;
  if (!Number.isInteger(begin) || !Number.isInteger(end) || (begin === 0 && end === 0)) {
    return null;
  }
  return Math.round(((begin as number) + (end as number)) / 2);
}

export function toArtwork(object: MetObject, entry: IndexEntry): Artwork | null {
  const imageSmall = object.primaryImageSmall?.trim();
  if (!object.isPublicDomain || !imageSmall) {
    return null;
  }
  return {
    id: entry.id,
    title: object.title?.trim() || 'Sans titre',
    artist: object.artistDisplayName?.trim() || null,
    date: object.objectDate?.trim() || null,
    year: yearOf(object),
    department: entry.department,
    rarity: entry.rarity,
    imageSmall,
    image: object.primaryImage?.trim() || imageSmall,
    metUrl: object.objectURL || `https://www.metmuseum.org/art/collection/search/${entry.id}`,
  };
}
