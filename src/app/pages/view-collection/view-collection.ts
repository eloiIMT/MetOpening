import { Component, computed, inject, signal } from '@angular/core';
import { Artwork } from '../../core/artwork';
import { BrowserItem, itemFromArtwork } from '../../core/browse';
import { CardIndexService } from '../../core/card-index.service';
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
    const owned = formatCount(items.length, 'œuvre', 'œuvres');
    const total = this.cardIndex.index()?.size;
    const outOf = total === undefined ? '' : ` sur ${total.toLocaleString('fr-FR')}`;
    return `${owned}${outOf} · ${formatCount(copies, 'exemplaire', 'exemplaires')}`;
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
