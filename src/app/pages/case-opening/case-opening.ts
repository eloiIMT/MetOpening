import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OPEN_AMOUNTS, OpenAmount, STOCK_MAX } from '../../core/game-rules';
import { OpeningService } from '../../core/opening.service';
import { StockService } from '../../core/stock.service';
import { formatCountdown } from '../../core/stock-rules';
import { CaseCrate } from '../../shared/case-crate/case-crate';

@Component({
  selector: 'app-case-opening',
  imports: [CaseCrate, RouterLink],
  templateUrl: './case-opening.html',
  styleUrl: './case-opening.scss',
})
export class CaseOpening {
  private readonly stockService = inject(StockService);
  private readonly openingService = inject(OpeningService);
  private readonly router = inject(Router);

  protected readonly stockMax = STOCK_MAX;
  protected readonly stock = this.stockService.stock;

  private readonly selectedAmount = signal<OpenAmount>(1);

  protected readonly amount = computed(() => {
    const allowed = OPEN_AMOUNTS.filter((value) => value <= this.stock());
    if (allowed.includes(this.selectedAmount())) {
      return this.selectedAmount();
    }
    return allowed.at(-1) ?? 0;
  });

  protected readonly options = computed(() =>
    OPEN_AMOUNTS.map((value) => ({
      value,
      label: `x${value}`,
      disabled: value > this.stock(),
      pressed: value === this.amount(),
    })),
  );

  protected readonly hint = computed(() => {
    const stock = this.stock();
    if (stock === 0) {
      return 'Votre stock est vide. Une caisse gratuite revient toutes les 3 minutes.';
    }
    const blocked = OPEN_AMOUNTS.filter((value) => value > stock);
    if (blocked.length === 0) {
      return null;
    }
    return "";
  });

  protected readonly openLabel = computed(() =>
    this.amount() === 1 ? 'Ouvrir 1 caisse' : `Ouvrir ${this.amount()} caisses`,
  );

  protected readonly stockUnit = computed(() => (this.stock() > 1 ? 'caisses gratuites' : 'caisse gratuite'));

  protected readonly countdown = computed(() => {
    const ms = this.stockService.msUntilNext();
    return ms === null ? null : formatCountdown(ms);
  });

  protected selectAmount(value: OpenAmount): void {
    this.selectedAmount.set(value);
  }

  protected open(): void {
    if (this.openingService.openFreeCases(this.amount())) {
      this.router.navigate(['/case-opening/open']);
    }
  }
}