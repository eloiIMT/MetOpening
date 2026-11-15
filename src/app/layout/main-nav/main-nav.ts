import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18n } from '../../core/i18n/i18n.service';
import { MessageKey } from '../../core/i18n/messages';
import { WalletService } from '../../core/wallet.service';
import { NAV_ICONS } from '../nav-icons';

interface NavLink {
  readonly path: string;
  readonly label: MessageKey;
  readonly shortLabel: MessageKey;
  readonly icon: string;
}

@Component({
  selector: 'app-main-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-nav.html',
  styleUrl: './main-nav.scss',
  host: {
    '[class.is-sticky]': 'sticky()',
  },
})
export class MainNav {
  readonly sticky = input(false, { transform: booleanAttribute });

  private readonly wallet = inject(WalletService);
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  protected readonly links: readonly NavLink[] = [
    { path: '/view-collection', label: 'nav.collection', shortLabel: 'nav.collectionShort', icon: NAV_ICONS.collection },
    { path: '/case-opening', label: 'nav.opening', shortLabel: 'nav.openingShort', icon: NAV_ICONS.opening },
    { path: '/case-shop', label: 'nav.shop', shortLabel: 'nav.shopShort', icon: NAV_ICONS.shop },
    { path: '/search-all-items', label: 'nav.search', shortLabel: 'nav.searchShort', icon: NAV_ICONS.search },
  ];

  protected readonly coinsLabel = computed(() => this.t('common.coins', { count: this.wallet.coins() }));
}
