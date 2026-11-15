import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CardSupplyService } from './core/game/card-supply.service';
import { I18n } from './core/i18n/i18n.service';
import { MetApiService } from './core/met/met-api.service';
import { MainNav } from './layout/main-nav/main-nav';
import { SiteFooter } from './layout/site-footer/site-footer';
import { ArtworkDialog } from './shared/artwork-dialog/artwork-dialog';

interface NavigationState {
  readonly data: Data;
  readonly artworkId: string | null;
}

const ARTWORK_PARAM = 'artwork';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav, SiteFooter, ArtworkDialog],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  protected readonly t = inject(I18n).t;
  protected readonly metPaused = inject(MetApiService).paused;

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => readNavigation(this.router.routerState.snapshot.root)),
    ),
    { initialValue: { data: {}, artworkId: null } as NavigationState },
  );

  protected readonly immersive = computed(() => this.navigation().data['immersive'] === true);
  protected readonly openArtworkId = computed(() => this.navigation().artworkId);

  constructor() {
    inject(CardSupplyService).start();
  }

  protected closeArtwork(): void {
    const tree = this.router.parseUrl(this.router.url);
    const { [ARTWORK_PARAM]: _closed, ...others } = tree.queryParams;
    tree.queryParams = others;
    this.router.navigateByUrl(tree);
  }
}

function readNavigation(root: ActivatedRouteSnapshot): NavigationState {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return {
    data: route.data,
    artworkId: root.queryParamMap.get(ARTWORK_PARAM),
  };
}
