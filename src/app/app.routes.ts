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
    path: 'case-opening/summary',
    title: 'Résumé de l’ouverture · Met Opening',
    loadComponent: () => import('./pages/opening-summary/opening-summary').then((m) => m.OpeningSummary),
  },
  { path: '**', redirectTo: 'case-opening' },
];