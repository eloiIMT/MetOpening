import { Component, computed, inject } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { ARTWORKS_PER_CASE, SLOT_ODDS, TOP_SLOT_ODDS } from '../../core/game/game-rules';

@Component({
  selector: 'app-case-odds',
  templateUrl: './case-odds.html',
  styleUrl: './case-odds.scss',
})
export class CaseOdds {
  private readonly i18n = inject(I18n);

  protected readonly t = this.i18n.t;
  protected readonly artworksPerCase = ARTWORKS_PER_CASE;

  protected readonly odds = computed(() => {
    const percent = (chance: number): string =>
      (chance * 100).toLocaleString(this.i18n.tag(), { maximumFractionDigits: 1 });
    return {
      common: percent(SLOT_ODDS.common),
      uncommon: percent(SLOT_ODDS.uncommon),
      top: percent(SLOT_ODDS.top),
      rare: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.rare),
      epic: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.epic),
      legendary: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.legendary),
    };
  });
}
