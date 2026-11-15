import { Component, computed, inject, input } from '@angular/core';
import { FavoritesService } from '../../core/collection/favorites.service';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      type="button"
      class="favorite tap"
      [class.favorite--on]="active()"
      [attr.aria-pressed]="active()"
      [attr.aria-label]="label()"
      [title]="shortLabel()"
      (click)="toggle($event)"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.5 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.6 0 5.6 3.7 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
        ></path>
      </svg>
    </button>
  `,
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
