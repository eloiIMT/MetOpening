import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { formatCoins } from '../../core/labels';
import { WalletService } from '../../core/wallet.service';
import { NAV_ICONS } from '../nav-icons';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
}

@Component({
  selector: 'app-main-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-nav.html',
  styleUrl: './main-nav.scss',
})
export class MainNav {
  private readonly wallet = inject(WalletService);

  protected readonly links: readonly NavLink[] = [
    { path: '/view-collection', label: 'Voir la collection', shortLabel: 'Collection', icon: NAV_ICONS.collection },
    { path: '/case-opening', label: 'Ouverture de caisses', shortLabel: 'Ouverture', icon: NAV_ICONS.opening },
    { path: '/case-shop', label: 'Boutique de caisses', shortLabel: 'Boutique', icon: NAV_ICONS.shop },
    { path: '/search-all-items', label: 'Rechercher dans les œuvres', shortLabel: 'Recherche', icon: NAV_ICONS.search },
  ];

  protected readonly coinsLabel = computed(() => formatCoins(this.wallet.coins()));
}