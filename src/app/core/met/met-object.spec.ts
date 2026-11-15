import { IndexEntry } from '../artworks/card-index';
import { MetObject, toArtwork, yearOf } from './met-object';

const ENTRY: IndexEntry = { id: 436535, rarity: 'legendary', department: 'european-paintings', century: 19 };

const OBJECT: MetObject = {
  objectID: 436535,
  title: ' Wheat Field with Cypresses ',
  artistDisplayName: 'Vincent van Gogh',
  objectDate: '1889',
  objectBeginDate: 1889,
  objectEndDate: 1889,
  isPublicDomain: true,
  primaryImage: 'https://images.metmuseum.org/original.jpg',
  primaryImageSmall: 'https://images.metmuseum.org/web-large.jpg',
  objectURL: 'https://www.metmuseum.org/art/collection/search/436535',
};

describe('toArtwork', () => {
  it('builds a game artwork from the Met record and the index entry', () => {
    expect(toArtwork(OBJECT, ENTRY)).toEqual({
      id: 436535,
      title: 'Wheat Field with Cypresses',
      artist: 'Vincent van Gogh',
      date: '1889',
      year: 1889,
      department: 'european-paintings',
      rarity: 'legendary',
      imageSmall: 'https://images.metmuseum.org/web-large.jpg',
      image: 'https://images.metmuseum.org/original.jpg',
      metUrl: 'https://www.metmuseum.org/art/collection/search/436535',
    });
  });

  it('rejects a work without image or outside the public domain', () => {
    expect(toArtwork({ ...OBJECT, primaryImageSmall: '' }, ENTRY)).toBeNull();
    expect(toArtwork({ ...OBJECT, isPublicDomain: false }, ENTRY)).toBeNull();
  });

  it('fills the missing texts with defaults', () => {
    const artwork = toArtwork({ ...OBJECT, title: '', artistDisplayName: '', objectDate: '' }, ENTRY);
    expect(artwork?.title).toBe('Sans titre');
    expect(artwork?.artist).toBeNull();
    expect(artwork?.date).toBeNull();
  });
});

describe('yearOf', () => {
  it('returns the middle of the date range, or null when unknown', () => {
    expect(yearOf({ objectID: 1, objectBeginDate: -550, objectEndDate: -510 })).toBe(-530);
    expect(yearOf({ objectID: 1, objectBeginDate: 0, objectEndDate: 0 })).toBeNull();
    expect(yearOf({ objectID: 1 })).toBeNull();
  });
});
