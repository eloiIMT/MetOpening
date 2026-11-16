import { TestBed } from '@angular/core/testing';
import { FAVORITES_STORAGE_KEY, FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds then removes a favorite', () => {
    const favorites = TestBed.inject(FavoritesService);
    favorites.toggle(42);
    expect(favorites.has(42)).toBe(true);
    expect(favorites.favorites().size).toBe(1);
    favorites.toggle(42);
    expect(favorites.has(42)).toBe(false);
  });

  it('saves the favorites in the browser', () => {
    TestBed.inject(FavoritesService).toggle(7);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual([7]);
  });

  it('ignores a damaged save', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, '[1, "x", 2.5, 3]');
    expect([...TestBed.inject(FavoritesService).favorites()]).toEqual([1, 3]);
  });
});
