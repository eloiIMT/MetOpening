import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../core/inventory.service';
import { I18n } from '../../core/i18n/i18n.service';
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
  private readonly i18n = inject(I18n);

  protected readonly t = this.i18n.t;

  protected readonly message = signal<{ id: ShopCaseId; count: number } | null>(null);

  protected readonly messageText = computed(() => {
    const message = this.message();
    return message
      ? this.t('cases.shopBought', { name: this.caseName(message.id), count: message.count })
      : null;
  });

  protected readonly groups = computed(() => {
    const coins = this.wallet.coins();
    return groupByPrice(SHOP_CASES).map((group) => ({
      price: group.price,
      heading: this.t('cases.shopGroupHeading', {
        price: this.t('common.coins', { count: group.price }),
        count: group.cases.length,
      }),
      slots: group.cases.map((shopCase) => {
        const owned = this.inventory.countOf(shopCase.id);
        return {
          id: shopCase.id,
          label: this.caseName(shopCase.id),
          owned,
          ownedLabel: owned === 0 ? this.t('cases.shopOwnedNone') : this.t('cases.shopOwned', { count: owned }),
          affordable: coins >= shopCase.price,
          priceLabel: this.t('common.coins', { count: shopCase.price }),
          buyLabel: this.t('cases.shopBuyLabel', {
            name: this.caseName(shopCase.id),
            price: this.t('common.coins', { count: shopCase.price }),
          }),
          missingLabel: this.t('cases.shopMissing', {
            price: this.t('common.coins', { count: shopCase.price - coins }),
          }),
        };
      }),
    }));
  });

  protected buy(id: ShopCaseId): void {
    const shopCase = findShopCase(id);
    if (shopCase && this.inventory.buy(shopCase)) {
      this.message.set({ id, count: this.inventory.countOf(id) });
    }
  }

  private caseName(id: ShopCaseId): string {
    return id === 'classic' ? this.t('crate.classicName') : this.t(`departments.${id}`);
  }
}
