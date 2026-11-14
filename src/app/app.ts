import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MainNav } from './layout/main-nav/main-nav';
import { SiteFooter } from './layout/site-footer/site-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.has-sticky-header]': 'stickyHeader()',
  },
})
export class App {
  private readonly router = inject(Router);

  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestData(this.router.routerState.snapshot.root)),
    ),
    { initialValue: {} as Data },
  );

  protected readonly immersive = computed(() => this.routeData()['immersive'] === true);
  protected readonly stickyHeader = computed(() => this.routeData()['stickyHeader'] === true);
}

function deepestData(root: ActivatedRouteSnapshot): Data {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.data;
}
