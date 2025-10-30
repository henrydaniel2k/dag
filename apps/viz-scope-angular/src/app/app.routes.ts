import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./features/runtime/runtime-page.component').then(
        (m) => m.RuntimePageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
