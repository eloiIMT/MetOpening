import { Routes } from '@angular/router';
import { MessageKey } from './core/i18n/messages';

export const routes: Routes = [
  { path: '', redirectTo: 'case-opening', pathMatch: 'full' },
  {
    path: 'case-opening',
    title: 'routes.caseOpening' satisfies MessageKey,
    loadComponent: () => import('./pages/case-opening/case-opening').then((m) => m.CaseOpening),
  },
  {
    path: 'case-opening/open',
    title: 'routes.opening' satisfies MessageKey,
    loadComponent: () => import('./pages/opening/opening').then((m) => m.Opening),
  },
  {
    path: 'case-opening/legendary',
    title: 'routes.legendary' satisfies MessageKey,
    data: { immersive: true },
    loadComponent: () => import('./pages/opening-legendary/opening-legendary').then((m) => m.OpeningLegendary),
  },
  {
    path: 'case-opening/summary',
    title: 'routes.summary' satisfies MessageKey,
    loadComponent: () => import('./pages/opening-summary/opening-summary').then((m) => m.OpeningSummary),
  },
  {
    path: 'view-collection',
    title: 'routes.collection' satisfies MessageKey,
    loadComponent: () => import('./pages/view-collection/view-collection').then((m) => m.ViewCollection),
  },
  {
    path: 'search-all-items',
    title: 'routes.search' satisfies MessageKey,
    loadComponent: () => import('./pages/search-all-items/search-all-items').then((m) => m.SearchAllItems),
  },
  {
    path: 'case-shop',
    title: 'routes.shop' satisfies MessageKey,
    loadComponent: () => import('./pages/case-shop/case-shop').then((m) => m.CaseShop),
  },
  { path: '**', redirectTo: 'case-opening' },
];