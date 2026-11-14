import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESALE_VALUE } from '../../core/game-rules';
import { OpeningService } from '../../core/opening.service';

@Component({
  selector: 'app-opening-legendary',
  imports: [RouterLink],
  templateUrl: './opening-legendary.html',
  styleUrl: './opening-legendary.scss',
})
export class OpeningLegendary {
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
    const artist = artwork.artist ?? 'Artiste inconnu';
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

  protected readonly resaleLabel = `${RESALE_VALUE.legendary.toLocaleString('fr-FR')} pièces`;

  protected next(): void {
    this.step.update((step) => step + 1);
  }
}
