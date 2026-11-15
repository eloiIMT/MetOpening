import { Component, booleanAttribute, computed, inject, input, resource } from '@angular/core';
import { BrowserItem } from '../../core/browse';
import { RARITY_LABEL } from '../../core/labels';
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

  private readonly lookup = resource({
    params: () => (this.item().artwork ? undefined : this.item()),
    loader: ({ params, abortSignal }) => this.met.getArtwork(params, true, abortSignal),
  });

  protected readonly artwork = computed(
    () => this.item().artwork ?? (this.lookup.hasValue() ? this.lookup.value() : null),
  );

  protected readonly loading = computed(() => this.lookup.isLoading());
  protected readonly tierLabel = computed(() => RARITY_LABEL[this.item().rarity]);

  protected readonly missingText = computed(() =>
    this.lookup.status() === 'error' ? 'Le Met ne répond pas' : 'Œuvre sans image libre de droits',
  );
}
