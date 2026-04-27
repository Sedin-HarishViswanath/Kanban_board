import { Routes } from '@angular/router';
import { Board } from './pages/board/board';
import { Home } from './pages/home/home';
import { Onboarding } from './pages/onboarding/onboarding';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'onboarding', component: Onboarding },
  { path: 'project/:id', component: Board },
  { path: '**', redirectTo: '' },
];
