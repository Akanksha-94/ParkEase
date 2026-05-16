import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'parking-lots',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadComponent: () => import('./features/parking-lots/parking-lots.component').then(m => m.ParkingLotsComponent)
      },
      {
        path: 'parking-spots',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadComponent: () => import('./features/parking-spots/parking-spots.component').then(m => m.ParkingSpotsComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.component').then(m => m.ReservationsComponent)
      },
      {
        path: 'reservations/:id',
        loadComponent: () => import('./features/reservations/reservation-details/reservation-details.component').then(m => m.ReservationDetailsComponent)
      },
      {
        path: 'analytics',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'vehicles',
        loadComponent: () => import('./features/vehicles/vehicles.component').then(m => m.VehiclesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
