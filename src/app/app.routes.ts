import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'case-opening', pathMatch: 'full' },
  {
    path: 'case-opening',
    title: 'Ouverture de caisses · Met Opening',
    loadComponent: () => import('./pages/case-opening/case-opening').then((m) => m.CaseOpening),
  },
  {
    path: 'case-opening/open',
    title: 'Ouverture en cours · Met Opening',
    loadComponent: () => import('./pages/opening/opening').then((m) => m.Opening),
  },
  {
    path: 'case-opening/legendary',
    title: 'Une Légendaire ! · Met Opening',
    data: { immersive: true },
    loadComponent: () => import('./pages/opening-legendary/opening-legendary').then((m) => m.OpeningLegendary),
  },
  {
    path: 'case-opening/summary',
    title: 'Résumé de l’ouverture · Met Opening',
    loadComponent: () => import('./pages/opening-summary/opening-summary').then((m) => m.OpeningSummary),
  },
  {
    path: 'view-collection',
    title: 'Ma collection · Met Opening',
    data: { stickyHeader: true },
    loadComponent: () => import('./pages/view-collection/view-collection').then((m) => m.ViewCollection),
  },
  {
    path: 'search-all-items',
    title: 'Rechercher dans les œuvres · Met Opening',
    data: { stickyHeader: true },
    loadComponent: () => import('./pages/search-all-items/search-all-items').then((m) => m.SearchAllItems),
  },
  { path: '**', redirectTo: 'case-opening' },
];