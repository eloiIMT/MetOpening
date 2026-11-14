import { Component, computed, inject } from '@angular/core';
import { ArtworkService } from '../../core/artwork.service';
import { BrowserItem } from '../../core/browse';
import { CollectionService } from '../../core/collection.service';
import { formatCount } from '../../core/labels';
import { ArtworkBrowser } from '../../shared/artwork-browser/artwork-browser';

@Component({
  selector: 'app-search-all-items',
  imports: [ArtworkBrowser],
  templateUrl: './search-all-items.html',
  styleUrl: './search-all-items.scss',
})
export class SearchAllItems {
  private readonly artworkService = inject(ArtworkService);
  private readonly collection = inject(CollectionService);

  protected readonly loading = this.artworkService.isLoading;

  protected readonly items = computed<BrowserItem[]>(() => {
    const owned = this.collection.owned();
    return this.artworkService.artworks().map((artwork) => {
      const entry = owned[artwork.id];
      return { artwork, copies: entry?.count ?? 0, obtainedAt: entry?.firstObtainedAt ?? null };
    });
  });

  protected readonly statsLabel = computed(() => {
    const items = this.items();
    const owned = items.filter((item) => item.copies > 0).length;
    return `${formatCount(items.length, 'œuvre', 'œuvres')} dans le jeu · ${formatCount(owned, 'possédée', 'possédées')}`;
  });
}
