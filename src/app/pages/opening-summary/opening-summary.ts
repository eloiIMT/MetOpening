import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RARITY_LABEL } from '../../core/labels';
import { OpeningService } from '../../core/opening.service';

@Component({
  selector: 'app-opening-summary',
  imports: [RouterLink],
  templateUrl: './opening-summary.html',
  styleUrl: './opening-summary.scss',
})
export class OpeningSummary {
  protected readonly result = inject(OpeningService).current;
  protected readonly rarityLabel = RARITY_LABEL;
}
