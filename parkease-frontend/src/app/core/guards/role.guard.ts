import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = auth.currentUser;
  const allowedRoles = route.data['roles'] as string[];

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error('Access Denied: You do not have permission to access this module.');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
