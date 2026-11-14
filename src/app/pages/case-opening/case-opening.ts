import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OPEN_AMOUNTS, OpenAmount, STOCK_MAX } from '../../core/game-rules';
import { InventoryService } from '../../core/inventory.service';
import { OpeningService } from '../../core/opening.service';
import { SHOP_CASES, ShopCaseId, findShopCase } from '../../core/shop';
import { StockService } from '../../core/stock.service';
import { formatCountdown } from '../../core/stock-rules';
import { CaseCrate } from '../../shared/case-crate/case-crate';
import { CaseOdds } from '../../shared/case-odds/case-odds';

type CaseChoice = 'free' | ShopCaseId;

@Component({
  selector: 'app-case-opening',
  imports: [CaseCrate, CaseOdds, RouterLink],
  templateUrl: './case-opening.html',
  styleUrl: './case-opening.scss',
})
export class CaseOpening {
  readonly type = input<string>();

  private readonly stockService = inject(StockService);
  private readonly inventory = inject(InventoryService);
  private readonly openingService = inject(OpeningService);
  private readonly router = inject(Router);

  protected readonly stockMax = STOCK_MAX;
  protected readonly stock = this.stockService.stock;

  private readonly selectedType = linkedSignal({
    source: this.type,
    computation: (type): CaseChoice => (type && findShopCase(type) ? (type as ShopCaseId) : 'free'),
  });

  protected readonly caseType = computed<CaseChoice>(() => {
    const type = this.selectedType();
    return type === 'free' || this.inventory.countOf(type) > 0 ? type : 'free';
  });

  protected readonly isFree = computed(() => this.caseType() === 'free');

  private readonly shopCase = computed(() => {
    const type = this.caseType();
    return type === 'free' ? null : (findShopCase(type) ?? null);
  });

  protected readonly typeOptions = computed(() => [
    { value: 'free' as CaseChoice, label: `Classique gratuite (${this.stock()})` },
    ...SHOP_CASES.filter((shopCase) => this.inventory.countOf(shopCase.id) > 0).map((shopCase) => ({
      value: shopCase.id as CaseChoice,
      label: `${shopCase.label} · achetée (${this.inventory.countOf(shopCase.id)})`,
    })),
  ]);

  protected readonly stencil = computed(() => this.shopCase()?.stencil ?? 'CLASSIQUE');

  protected readonly available = computed(() => {
    const shopCase = this.shopCase();
    return shopCase ? this.inventory.countOf(shopCase.id) : this.stock();
  });

  private readonly selectedAmount = signal<OpenAmount>(1);

  protected readonly amount = computed(() => {
    const allowed = OPEN_AMOUNTS.filter((value) => value <= this.available());
    if (allowed.includes(this.selectedAmount())) {
      return this.selectedAmount();
    }
    return allowed.at(-1) ?? 0;
  });

  protected readonly options = computed(() =>
    OPEN_AMOUNTS.map((value) => ({
      value,
      label: `x${value}`,
      disabled: value > this.available(),
      pressed: value === this.amount(),
    })),
  );

  protected readonly hint = computed(() =>
    this.isFree() && this.stock() === 0
      ? 'Votre stock est vide. Une caisse gratuite revient toutes les 3 minutes.'
      : null,
  );

  protected readonly openLabel = computed(() =>
    this.amount() === 1 ? 'Ouvrir 1 caisse' : `Ouvrir ${this.amount()} caisses`,
  );

  protected readonly stockUnit = computed(() => (this.stock() > 1 ? 'caisses gratuites' : 'caisse gratuite'));

  protected readonly ownedUnit = computed(() =>
    this.available() > 1 ? 'caisses achetées' : 'caisse achetée',
  );

  protected readonly shopCaseText = computed(() => {
    const shopCase = this.shopCase();
    if (!shopCase) {
      return '';
    }
    return shopCase.department === null
      ? 'Œuvres tirées dans tout le jeu'
      : `Œuvres tirées uniquement dans « ${shopCase.label} »`;
  });

  protected readonly countdown = computed(() => {
    const ms = this.stockService.msUntilNext();
    return ms === null ? null : formatCountdown(ms);
  });

  protected pickType(event: Event): void {
    this.selectedType.set((event.target as HTMLSelectElement).value as CaseChoice);
  }

  protected selectAmount(value: OpenAmount): void {
    this.selectedAmount.set(value);
  }

  protected open(): void {
    const shopCase = this.shopCase();
    const opened = shopCase
      ? this.openingService.openBoughtCases(shopCase, this.amount())
      : this.openingService.openFreeCases(this.amount());
    if (opened) {
      this.router.navigate(['/case-opening/open']);
    }
  }
}
