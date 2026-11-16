import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESALE_VALUE } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { OpeningService } from '../../core/game/opening.service';

@Component({
  selector: 'app-opening-legendary',
  imports: [RouterLink],
  templateUrl: './opening-legendary.html',
  styleUrl: './opening-legendary.scss',
})
export class OpeningLegendary {
  protected readonly t = inject(I18n).t;
  private readonly result = inject(OpeningService).current;
  private readonly step = signal(0);

  protected readonly legendaries = computed(() =>
    (this.result()?.cases.flat() ?? []).filter((item) => item.artwork.rarity === 'legendary'),
  );

  protected readonly isLast = computed(() => this.step() >= this.legendaries().length - 1);

  protected readonly shown = computed(() => {
    const item = this.legendaries()[this.step()];
    if (!item) {
      return [];
    }
    const { artwork } = item;
    const artist = artwork.artist ?? this.t('openings.legendaryUnknownArtist');
    return [
      {
        step: this.step(),
        artwork,
        isNew: item.isNew,
        meta: artwork.date ? `${artist} · ${artwork.date}` : artist,
        alt: `${artwork.title}, ${artist}`,
      },
    ];
  });

  protected readonly resaleLabel = computed(() => this.t('common.coins', { count: RESALE_VALUE.legendary }));

  protected next(): void {
    this.step.update((step) => step + 1);
  }
}
