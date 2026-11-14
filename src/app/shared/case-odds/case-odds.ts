import { Component } from '@angular/core';
import { ARTWORKS_PER_CASE, SLOT_ODDS, TOP_SLOT_ODDS } from '../../core/game-rules';

function percent(chance: number): string {
  return (chance * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

@Component({
  selector: 'app-case-odds',
  templateUrl: './case-odds.html',
  styleUrl: './case-odds.scss',
})
export class CaseOdds {
  protected readonly artworksPerCase = ARTWORKS_PER_CASE;

  protected readonly odds = {
    common: percent(SLOT_ODDS.common),
    uncommon: percent(SLOT_ODDS.uncommon),
    top: percent(SLOT_ODDS.top),
    rare: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.rare),
    epic: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.epic),
    legendary: percent(SLOT_ODDS.top * TOP_SLOT_ODDS.legendary),
  };
}
