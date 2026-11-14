import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../core/inventory.service';
import { formatCoins, formatCount } from '../../core/labels';
import { SHOP_CASES, ShopCaseId, findShopCase, groupByPrice } from '../../core/shop';
import { WalletService } from '../../core/wallet.service';
import { CaseCrate } from '../../shared/case-crate/case-crate';

@Component({
  selector: 'app-case-shop',
  imports: [CaseCrate, RouterLink],
  templateUrl: './case-shop.html',
  styleUrl: './case-shop.scss',
})
export class CaseShop {
  private readonly wallet = inject(WalletService);
  private readonly inventory = inject(InventoryService);

  protected readonly message = signal<string | null>(null);
  protected readonly coinsLabel = computed(() => formatCoins(this.wallet.coins()));

  protected readonly groups = computed(() => {
    const coins = this.wallet.coins();
    return groupByPrice(SHOP_CASES).map((group) => ({
      price: group.price,
      heading: `${formatCoins(group.price)} · ${formatCount(group.cases.length, 'caisse', 'caisses')}`,
      slots: group.cases.map((shopCase) => {
        const owned = this.inventory.countOf(shopCase.id);
        return {
          id: shopCase.id,
          label: shopCase.label,
          stencil: shopCase.stencil,
          owned,
          ownedLabel: owned === 0 ? 'Vous n’en avez aucune' : `Vous en avez ${owned}`,
          affordable: coins >= shopCase.price,
          priceLabel: formatCoins(shopCase.price),
          buyLabel: `Acheter ${shopCase.label} pour ${formatCoins(shopCase.price)}`,
          missingLabel: `Il manque ${formatCoins(shopCase.price - coins)}`,
        };
      }),
    }));
  });

  protected buy(id: ShopCaseId): void {
    const shopCase = findShopCase(id);
    if (shopCase && this.inventory.buy(shopCase)) {
      this.message.set(`${shopCase.label} achetée. Vous en avez ${this.inventory.countOf(id)}.`);
    }
  }
}
