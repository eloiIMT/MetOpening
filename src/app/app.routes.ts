import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'case-opening', pathMatch: 'full' },
  {
    path: 'case-opening',
    loadComponent: () => import('./pages/case-opening/case-opening').then((m) => m.CaseOpening),
  },
  {
    path: 'case-opening/open',
    loadComponent: () => import('./pages/opening/opening').then((m) => m.Opening),
  },
  {
    path: 'case-opening/legendary',
    data: { immersive: true },
    loadComponent: () => import('./pages/opening-legendary/opening-legendary').then((m) => m.OpeningLegendary),
  },
  {
    path: 'case-opening/summary',
    loadComponent: () => import('./pages/opening-summary/opening-summary').then((m) => m.OpeningSummary),
  },
  {
    path: 'view-collection',
    loadComponent: () => import('./pages/view-collection/view-collection').then((m) => m.ViewCollection),
  },
  {
    path: 'search-all-items',
    loadComponent: () => import('./pages/search-all-items/search-all-items').then((m) => m.SearchAllItems),
  },
  {
    path: 'case-shop',
    loadComponent: () => import('./pages/case-shop/case-shop').then((m) => m.CaseShop),
  },
  { path: '**', redirectTo: 'case-opening' },
];