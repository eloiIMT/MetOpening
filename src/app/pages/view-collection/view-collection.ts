import { Component, computed, inject, signal } from '@angular/core';
import { Artwork } from '../../core/artwork';
import { ArtworkService } from '../../core/artwork.service';
import { BrowserItem } from '../../core/browse';
import { CollectionService } from '../../core/collection.service';
import { formatCoins, formatCount } from '../../core/labels';
import { ArtworkBrowser } from '../../shared/artwork-browser/artwork-browser';

@Component({
  selector: 'app-view-collection',
  imports: [ArtworkBrowser],
  templateUrl: './view-collection.html',
  styleUrl: './view-collection.scss',
})
export class ViewCollection {
  private readonly artworkService = inject(ArtworkService);
  private readonly collection = inject(CollectionService);

  protected readonly loading = this.artworkService.isLoading;
  protected readonly saleMessage = signal<string | null>(null);

  protected readonly items = computed<BrowserItem[]>(() => {
    const owned = this.collection.owned();
    return this.artworkService.artworks().flatMap((artwork) => {
      const entry = owned[artwork.id];
      return entry ? [{ artwork, copies: entry.count, obtainedAt: entry.firstObtainedAt }] : [];
    });
  });

  protected readonly statsLabel = computed(() => {
    const items = this.items();
    const copies = items.reduce((sum, item) => sum + item.copies, 0);
    const owned = formatCount(items.length, 'œuvre', 'œuvres');
    return `${owned} sur ${this.artworkService.artworks().length} · ${formatCount(copies, 'exemplaire', 'exemplaires')}`;
  });

  protected sell(artworks: readonly Artwork[]): void {
    const result = this.collection.sellDuplicates(artworks);
    this.saleMessage.set(
      result.sold === 0
        ? 'Aucun double à vendre.'
        : `${formatCount(result.sold, 'double vendu', 'doubles vendus')} pour ${formatCoins(result.coins)}.`,
    );
  }
}
