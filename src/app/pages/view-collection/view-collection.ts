import { Component, computed, inject, signal } from '@angular/core';
import { Artwork } from '../../core/artworks/artwork';
import { BrowserItem, itemFromArtwork } from '../../core/artworks/browse';
import { CardIndexService } from '../../core/artworks/card-index.service';
import { CollectionService } from '../../core/collection/collection.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ArtworkBrowser } from '../../shared/artwork-browser/artwork-browser';

@Component({
  selector: 'app-view-collection',
  imports: [ArtworkBrowser],
  templateUrl: './view-collection.html',
  styleUrl: './view-collection.scss',
})
export class ViewCollection {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  private readonly cardIndex = inject(CardIndexService);
  private readonly collection = inject(CollectionService);

  protected readonly saleMessage = signal<string | null>(null);

  constructor() {
    void this.cardIndex.load();
  }

  protected readonly items = computed<BrowserItem[]>(() =>
    Object.values(this.collection.owned()).map((entry) =>
      itemFromArtwork(entry.artwork, entry.count, entry.firstObtainedAt),
    ),
  );

  protected readonly statsLabel = computed(() => {
    const items = this.items();
    const copies = items.reduce((sum, item) => sum + item.copies, 0);
    const owned = this.t('common.artworks', { count: items.length });
    const copiesText = this.t('common.copies', { count: copies });
    const total = this.cardIndex.index()?.size;
    return total === undefined
      ? this.t('artworks.collectionStats', { owned, copies: copiesText })
      : this.t('artworks.collectionStatsOf', { owned, total: this.i18n.number(total), copies: copiesText });
  });

  protected sell(artworks: readonly Artwork[]): void {
    const result = this.collection.sellDuplicates(artworks);
    this.saleMessage.set(
      result.sold === 0
        ? this.t('artworks.collectionNoDuplicates')
        : this.t('artworks.collectionSold', {
            count: result.sold,
            coins: this.t('common.coins', { count: result.coins }),
          }),
    );
  }
}
