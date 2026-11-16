import { Component, DestroyRef, computed, inject, resource, signal } from '@angular/core';
import { BrowserItem } from '../../core/artworks/browse';
import { CardIndex, entryAt } from '../../core/artworks/card-index';
import { CardIndexService } from '../../core/artworks/card-index.service';
import { CollectionService } from '../../core/collection/collection.service';
import { I18n } from '../../core/i18n/i18n.service';
import { MetApiService } from '../../core/met/met-api.service';
import { ArtworkBrowser } from '../../shared/artwork-browser/artwork-browser';

const SEARCH_DELAY_MS = 400;

@Component({
  selector: 'app-search-all-items',
  imports: [ArtworkBrowser],
  templateUrl: './search-all-items.html',
  styleUrl: './search-all-items.scss',
})
export class SearchAllItems {
  protected readonly t = inject(I18n).t;

  private readonly cardIndex = inject(CardIndexService);
  private readonly collection = inject(CollectionService);
  private readonly met = inject(MetApiService);

  private readonly term = signal('');
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly matches = resource({
    params: () => this.term() || undefined,
    loader: ({ params }) => this.met.searchIds(params),
  });

  private readonly catalog = computed(() => {
    const index = this.cardIndex.index();
    return index ? catalogOf(index) : [];
  });

  private readonly allItems = computed<BrowserItem[]>(() => {
    const owned = this.collection.owned();
    return this.catalog().map((entry) => {
      const mine = owned[entry.id];
      return mine ? { ...entry, artwork: mine.artwork, copies: mine.count, obtainedAt: mine.firstObtainedAt } : entry;
    });
  });

  protected readonly items = computed<BrowserItem[]>(() => {
    if (this.term() === '') {
      return this.allItems();
    }
    if (!this.matches.hasValue()) {
      return [];
    }
    const ids = new Set(this.matches.value().ids);
    return this.allItems().filter((item) => ids.has(item.id));
  });

  protected readonly loading = computed(
    () => this.cardIndex.index() === null || (this.term() !== '' && this.matches.isLoading()),
  );

  protected readonly note = computed(() => {
    if (this.term() === '') {
      return null;
    }
    if (this.matches.status() === 'error') {
      return this.t('artworks.searchFailed');
    }
    if (!this.matches.hasValue()) {
      return null;
    }
    const { total, ids } = this.matches.value();
    return total > ids.length ? this.t('artworks.searchNote', { count: total, shown: ids.length }) : null;
  });

  protected readonly statsLabel = computed(() => {
    const all = this.allItems();
    const owned = this.collection.ownedCount();
    return this.t('artworks.searchStats', {
      artworks: this.t('common.artworks', { count: all.length }),
      owned: this.t('artworks.searchOwned', { count: owned }),
    });
  });

  constructor() {
    void this.cardIndex.load();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected search(query: string): void {
    clearTimeout(this.timer);
    const trimmed = query.trim();
    if (trimmed === '') {
      this.term.set('');
      return;
    }
    this.timer = setTimeout(() => this.term.set(trimmed), SEARCH_DELAY_MS);
  }
}

function catalogOf(index: CardIndex): BrowserItem[] {
  return Array.from({ length: index.size }, (_, position) => ({
    ...entryAt(index, position),
    artwork: null,
    copies: 0,
    obtainedAt: null,
  }));
}
