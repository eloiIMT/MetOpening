import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork } from '../../core/artworks/artwork';
import { RARITY_RANK } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-artwork-card',
  imports: [RouterLink],
  templateUrl: './artwork-card.html',
  styleUrl: './artwork-card.scss',
})
export class ArtworkCard {
  readonly artwork = input.required<Artwork>();
  readonly badge = input<string | null>(null);
  readonly note = input<string | null>(null);
  readonly openable = input(false, { transform: booleanAttribute });
  readonly greyed = input(false, { transform: booleanAttribute });

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  protected readonly openQuery = computed(() => ({ artwork: this.artwork().id }));

  protected readonly artist = computed(() => this.artwork().artist ?? this.t('common.unknownArtist'));
  protected readonly date = computed(() => this.artwork().date ?? this.t('common.unknownDate'));
  protected readonly tierLabel = computed(() => this.t(`rarities.${this.artwork().rarity}`));
  protected readonly isTop = computed(() => RARITY_RANK[this.artwork().rarity] >= RARITY_RANK.epic);

  protected readonly openLabel = computed(() => {
    const parts = [this.t('artworks.cardOpen', { title: this.artwork().title }), this.artist(), this.tierLabel()];
    if (this.greyed()) {
      parts.push(this.t('artworks.cardNotOwned'));
    }
    const badge = this.badge();
    if (badge) {
      parts.push(badge);
    }
    return parts.join(', ');
  });
}
