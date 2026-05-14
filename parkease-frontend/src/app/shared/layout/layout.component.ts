import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models/user.model';

interface NavItem {
  label: string;
  path: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard"><span>P</span>ParkEase</a>
        <nav>
          @for (item of visibleNavItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.label }}</a>
          }
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <p>Welcome back</p>
            <h1>{{ auth.getCurrentUser()?.fullName || 'ParkEase user' }}</h1>
          </div>
          <button type="button" class="button secondary" (click)="logout()">Logout</button>
        </header>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 248px 1fr;
      min-height: 100vh;
    }

    .sidebar {
      background: #102236;
      color: #fff;
      padding: 20px;
    }

    .brand {
      align-items: center;
      display: flex;
      font-size: 1.2rem;
      font-weight: 900;
      gap: 12px;
      margin-bottom: 28px;
      text-decoration: none;
    }

    .brand span {
      align-items: center;
      background: var(--accent);
      border-radius: 8px;
      display: inline-flex;
      height: 38px;
      justify-content: center;
      width: 38px;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    nav a {
      border-radius: 8px;
      color: #dbe8f5;
      padding: 12px;
      text-decoration: none;
    }

    nav a.active,
    nav a:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .workspace {
      padding: 24px;
    }

    .topbar {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .topbar p,
    .topbar h1 {
      margin: 0;
    }

    .topbar p {
      color: var(--text-muted);
      font-weight: 800;
    }

    @media (max-width: 760px) {
      .shell {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Parking lots', path: '/lots' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'Vehicles', path: '/vehicles' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Analytics', path: '/analytics', roles: ['ADMIN', 'MANAGER'] }
  ];

  get visibleNavItems(): NavItem[] {
    const role = this.auth.getRole();
    return this.navItems.filter((item) => !item.roles?.length || (role && item.roles.includes(role)));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
