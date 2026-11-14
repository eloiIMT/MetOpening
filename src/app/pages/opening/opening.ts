import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OpeningService } from '../../core/opening.service';

@Component({
  selector: 'app-opening',
  imports: [RouterLink],
  templateUrl: './opening.html',
  styleUrl: './opening.scss',
})
export class Opening {
  protected readonly result = inject(OpeningService).current;

  protected readonly title = computed(() => {
    const count = this.result()?.cases.length ?? 0;
    return count > 1 ? `${count} caisses ouvertes` : '1 caisse ouverte';
  });
}
