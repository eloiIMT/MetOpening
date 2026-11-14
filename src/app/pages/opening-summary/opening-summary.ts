import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESALE_VALUE } from '../../core/game-rules';
import { RARITY_LABEL, RARITY_LABEL_PLURAL, formatCoins, formatCount } from '../../core/labels';
import { OpeningService } from '../../core/opening.service';
import { summarizeOpening } from '../../core/summary';
import { ArtworkCard } from '../../shared/artwork-card/artwork-card';

const FIRST_CARD_DELAY_MS = 80;
const CARD_STAGGER_MS = 40;
const MAX_CARD_DELAY_MS = 800;

@Component({
  selector: 'app-opening-summary',
  imports: [RouterLink, ArtworkCard],
  templateUrl: './opening-summary.html',
  styleUrl: './opening-summary.scss',
})
export class OpeningSummary {
  private readonly result = inject(OpeningService).current;

  protected readonly recap = computed(() => {
    const result = this.result();
    return result ? summarizeOpening(result.cases.flat()) : null;
  });

  private readonly caseCount = computed(() => this.result()?.cases.length ?? 0);

  protected readonly heading = computed(() => {
    const total = this.recap()?.total ?? 0;
    return this.caseCount() > 1
      ? `Vos ${this.caseCount()} caisses contenaient ${total} œuvres`
      : `Votre caisse contenait ${total} œuvres`;
  });

  protected readonly tally = computed(() =>
    (this.recap()?.tally ?? []).map((entry) => ({
      rarity: entry.rarity,
      color: `var(--rarity-${entry.rarity})`,
      label: formatCount(entry.count, RARITY_LABEL[entry.rarity], RARITY_LABEL_PLURAL[entry.rarity]),
    })),
  );

  protected readonly valueLabel = computed(() => formatCoins(this.recap()?.value ?? 0));

  protected readonly groupTitle = computed(() => {
    const recap = this.recap();
    if (!recap) {
      return '';
    }
    return recap.items.length === recap.total
      ? `Les ${recap.total} œuvres`
      : `${recap.items.length} œuvres différentes`;
  });

  protected readonly cards = computed(() =>
    (this.recap()?.items ?? []).map((item, index) => {
      const copies = item.copies > 1 ? ` · ×${item.copies}` : '';
      return {
        artwork: item.artwork,
        badge: `${item.isNew ? 'Nouvelle' : 'Double'}${copies}`,
        note: formatCoins(item.copies * RESALE_VALUE[item.artwork.rarity]),        delay: Math.min(FIRST_CARD_DELAY_MS + index * CARD_STAGGER_MS, MAX_CARD_DELAY_MS),
      };
    }),
  );
}
