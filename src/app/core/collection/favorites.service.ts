import { Injectable, signal } from '@angular/core';

export const FAVORITES_STORAGE_KEY = 'met-opening.favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly ids = signal<ReadonlySet<number>>(readStoredFavorites());

  readonly favorites = this.ids.asReadonly();

  has(id: number): boolean {
    return this.ids().has(id);
  }

  toggle(id: number): void {
    const next = new Set(this.ids());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.ids.set(next);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      return;
    }
  }
}

function readStoredFavorites(): ReadonlySet<number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
}
