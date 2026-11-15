import { Component, booleanAttribute, computed, inject, input, resource } from '@angular/core';
import { BrowserItem } from '../../core/browse';
import { I18n } from '../../core/i18n/i18n.service';
import { MetApiService } from '../../core/met-api.service';
import { ArtworkCard } from '../artwork-card/artwork-card';

@Component({
  selector: 'app-catalog-card',
  imports: [ArtworkCard],
  templateUrl: './catalog-card.html',
  styleUrl: './catalog-card.scss',
})
export class CatalogCard {
  readonly item = input.required<BrowserItem>();
  readonly badge = input<string | null>(null);
  readonly greyed = input(false, { transform: booleanAttribute });

  private readonly met = inject(MetApiService);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  private readonly lookup = resource({
    params: () => (this.item().artwork ? undefined : this.item()),
    loader: ({ params, abortSignal }) => this.met.getArtwork(params, true, abortSignal),
  });

  protected readonly artwork = computed(
    () => this.item().artwork ?? (this.lookup.hasValue() ? this.lookup.value() : null),
  );

  protected readonly loading = computed(() => this.lookup.isLoading());
  protected readonly tierLabel = computed(() => this.t(`rarities.${this.item().rarity}`));

  protected readonly idText = computed(() => String(this.item().id));

  protected readonly missingText = computed(() =>
    this.t(this.lookup.status() === 'error' ? 'artworks.catalogNoServer' : 'artworks.catalogNoImage'),
  );
}
