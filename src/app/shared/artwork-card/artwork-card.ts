import { Component, booleanAttribute, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork } from '../../core/artwork';
import { RARITY_RANK } from '../../core/game-rules';
import { RARITY_LABEL } from '../../core/labels';

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

  protected readonly openQuery = computed(() => ({ artwork: this.artwork().id }));

  protected readonly artist = computed(() => this.artwork().artist ?? 'Artiste non identifié');
  protected readonly date = computed(() => this.artwork().date ?? 'Date inconnue');
  protected readonly tierLabel = computed(() => RARITY_LABEL[this.artwork().rarity]);
  protected readonly isTop = computed(() => RARITY_RANK[this.artwork().rarity] >= RARITY_RANK.epic);

  protected readonly openLabel = computed(() => {
    const parts = [`Ouvrir la fiche de ${this.artwork().title}`, this.artist(), this.tierLabel()];
    if (this.greyed()) {
      parts.push('non possédée');
    }
    const badge = this.badge();
    if (badge) {
      parts.push(badge);
    }
    return parts.join(', ');
  });
}
