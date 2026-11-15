import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESALE_VALUE } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { OpeningService } from '../../core/game/opening.service';
import { summarizeOpening } from '../../core/game/summary';
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
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly result = inject(OpeningService).current;

  protected readonly recap = computed(() => {
    const result = this.result();
    return result ? summarizeOpening(result.cases.flat()) : null;
  });

  private readonly caseCount = computed(() => this.result()?.cases.length ?? 0);

  protected readonly heading = computed(() => {
    const total = this.recap()?.total ?? 0;
    return this.caseCount() > 1
      ? this.t('openings.summaryHeadingMany', { cases: this.caseCount(), count: total })
      : this.t('openings.summaryHeadingOne', { count: total });
  });

  protected readonly tally = computed(() =>
    (this.recap()?.tally ?? []).map((entry) => ({
      rarity: entry.rarity,
      color: `var(--rarity-${entry.rarity})`,
      label: this.t('openings.summaryTally', {
        count: entry.count,
        name: this.t(entry.count > 1 ? `raritiesPlural.${entry.rarity}` : `rarities.${entry.rarity}`),
      }),
    })),
  );

  protected readonly valueLabel = computed(() => this.t('common.coins', { count: this.recap()?.value ?? 0 }));

  protected readonly groupTitle = computed(() => {
    const recap = this.recap();
    if (!recap) {
      return '';
    }
    return recap.items.length === recap.total
      ? this.t('openings.summaryGroupAll', { count: recap.total })
      : this.t('openings.summaryGroupDistinct', { count: recap.items.length });
  });

  protected readonly cards = computed(() =>
    (this.recap()?.items ?? []).map((item, index) => {
      const copies = item.copies > 1 ? ` · ×${item.copies}` : '';
      return {
        artwork: item.artwork,
        badge: `${this.t(item.isNew ? 'openings.summaryBadgeNew' : 'openings.summaryBadgeDuplicate')}${copies}`,
        note: this.t('common.coins', { count: item.copies * RESALE_VALUE[item.artwork.rarity] }),
        delay: Math.min(FIRST_CARD_DELAY_MS + index * CARD_STAGGER_MS, MAX_CARD_DELAY_MS),
      };
    }),
  );
}
