import { Artwork } from './artwork';

const DB_NAME = 'met-opening';
const DB_VERSION = 1;
const STORE = 'artworks';

export interface CachedArtwork {
  readonly artwork: Artwork | null;
  readonly fetchedAt: number;
}

let database: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  database ??= new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return database;
}

export async function readCachedArtwork(id: number): Promise<CachedArtwork | undefined> {
  const db = await openDatabase();
  if (!db) {
    return undefined;
  }
  return new Promise((resolve) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as CachedArtwork | undefined);
    request.onerror = () => resolve(undefined);
  });
}

export async function writeCachedArtwork(id: number, value: CachedArtwork): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    return;
  }
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(value, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });
}
