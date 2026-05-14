import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/user.model';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const role = auth.getRole();

  if (!allowedRoles?.length || (role && allowedRoles.includes(role))) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
