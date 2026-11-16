import { Component, computed, inject, input } from '@angular/core';
import { FavoritesService } from '../../core/collection/favorites.service';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.html',
  styleUrl: './favorite-button.scss',
  host: {
    '[class.is-favorite]': 'active()',
  },
})
export class FavoriteButton {
  readonly artworkId = input.required<number>();
  readonly title = input.required<string>();

  private readonly favorites = inject(FavoritesService);
  private readonly i18n = inject(I18n);

  protected readonly active = computed(() => this.favorites.favorites().has(this.artworkId()));

  protected readonly label = computed(() =>
    this.i18n.t(this.active() ? 'favorites.remove' : 'favorites.add', { title: this.title() }),
  );

  protected readonly shortLabel = computed(() =>
    this.i18n.t(this.active() ? 'favorites.removeShort' : 'favorites.addShort'),
  );

  protected toggle(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.artworkId());
  }
}
