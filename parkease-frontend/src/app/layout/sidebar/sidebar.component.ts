import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
  badge?: number;
}

const BASE_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z' },
  { label: 'Parking Lots', route: '/parking-lots', icon: 'M12 21a8 8 0 100-16 8 8 0 000 16z M12 8v4l3 3', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Parking Spots', route: '/parking-spots', icon: 'M3 3h18v18H3V3z M3 9h18 M3 15h18 M9 3v18 M15 3v18', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reservations', route: '/reservations', icon: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { label: 'My Vehicles', route: '/vehicles', icon: 'M7 17a2 2 0 002 2h10a2 2 0 002-2M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { label: 'Payments', route: '/payments', icon: 'M3 10h18 M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Notifications', route: '/notifications', icon: 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0' },
  { label: 'Analytics', route: '/analytics', icon: 'M18 20V10 M12 20V4 M6 20v-6', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Profile', route: '/profile', icon: 'M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2 M12 7a4 4 0 100-8 4 4 0 000 8z' }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar-container" [class.collapsed]="collapsed">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="brand-row">
          <div class="logo-box" (click)="navigateDashboard()">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <span class="brand-text" *ngIf="!collapsed">ParkEase</span>
          </div>

          <button *ngIf="!collapsed" type="button" class="collapse-btn" (click)="toggleCollapse.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
        </div>

        <button *ngIf="collapsed" type="button" class="expand-btn" (click)="toggleCollapse.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </div>

      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <nav class="nav-menu">
          <a *ngFor="let item of visibleItems"
             class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             #rla="routerLinkActive"
             [title]="collapsed ? item.label : ''">
            
            <div class="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icon"></path>
              </svg>
            </div>

            <span class="label" *ngIf="!collapsed">{{ item.label }}</span>

            <span *ngIf="item.label === 'Notifications' && unreadCount() > 0"
                  class="badge"
                  [class.active-badge]="rla.isActive"
                  [class.inactive-badge]="!rla.isActive">
              {{ unreadCount() > 99 ? '99+' : unreadCount() }}
            </span>
          </a>
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <a routerLink="/profile" class="profile-pill">
          <div class="avatar-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"></path>
            </svg>
          </div>
          
          <div class="user-info" *ngIf="!collapsed">
            <p class="user-email">{{ user?.email || 'User Account' }}</p>
            <div class="user-role-box">
              <div class="role-dot"></div>
              <p class="role-text">{{ user?.role || 'Guest' }}</p>
            </div>
          </div>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      position: fixed; 
      top: 0; left: 0; bottom: 0;
      width: var(--sidebar-w); 
      z-index: 200;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--sidebar-bg);
      backdrop-filter: blur(24px);
      border-right: 1px solid var(--border-color);
      display: flex; flex-direction: column;
    }

    .sidebar-header {
      padding: 24px;
      display: flex; flex-direction: column; gap: 24px;
      
      .brand-row {
        display: flex; align-items: center; justify-content: space-between;
        
        .logo-box {
          display: flex; align-items: center; gap: 16px; cursor: pointer;
          &:hover .logo-icon { transform: scale(1.1); }
          
          .logo-icon {
            width: 44px; height: 44px; border-radius: 12px;
            background: var(--text-primary); color: var(--bg-base);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.5s var(--trans);
            svg { width: 24px; height: 24px; }
          }
          
          .brand-text {
            font-family: var(--font-heading); font-size: 20px; font-weight: 800;
            letter-spacing: -0.02em; color: var(--text-primary);
          }
        }
        
        .collapse-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg-hover); color: oklch(var(--foreground) / 60%);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
          &:hover { background: var(--text-primary); color: var(--bg-base); }
          svg { width: 20px; height: 20px; }
        }
      }

      .expand-btn {
        width: 44px; height: 44px; margin: 0 auto;
        border-radius: 12px; background: var(--bg-hover);
        display: flex; align-items: center; justify-content: center;
        color: oklch(var(--foreground) / 60%); transition: all 0.3s;
        &:hover { background: var(--text-primary); color: var(--bg-base); }
      }
    }

    .sidebar-content {
      flex: 1; padding: 12px 20px; overflow-y: auto;
      &::-webkit-scrollbar { width: 0; }
    }

    .nav-menu { display: flex; flex-direction: column; gap: 8px; }

    .nav-item {
      height: 56px; border-radius: 16px; 
      display: flex; align-items: center; transition: all 0.5s var(--trans);
      text-decoration: none; position: relative;
      
      color: oklch(var(--muted-fg) / 90%);
      
      &.active {
        background: var(--text-primary); color: var(--bg-base);
        box-shadow: 0 10px 25px oklch(var(--foreground) / 10%);
        .icon { transform: scale(1.1); }
      }
      
      &:not(.active):hover {
        background: var(--bg-hover); color: var(--text-primary);
      }

      .icon {
        width: 56px; display: flex; align-items: center; justify-content: center;
        transition: transform 0.5s;
        svg { width: 20px; height: 20px; }
      }

      .label {
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.15em; flex: 1;
      }

      .badge {
        margin-right: 16px; height: 20px; min-width: 20px;
        border-radius: 99px; font-size: 9px; font-weight: 800;
        display: flex; align-items: center; justify-content: center; padding: 0 6px;
        
        &.active-badge { background: var(--bg-base); color: var(--text-primary); }
        &.inactive-badge { background: var(--primary-color); color: var(--primary-fg, #fff); }
      }
    }

    .sidebar-footer {
      padding: 20px; border-top: 1px solid var(--border-color);
      
      .profile-pill {
        display: flex; align-items: center; gap: 16px; padding: 16px;
        background: var(--bg-hover);
        border: 1px solid var(--border-color);
        border-radius: 24px; transition: var(--trans);
        text-decoration: none;
        
        &:hover { background: var(--bg-card); }
        
        .avatar-box {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--text-primary); color: var(--bg-base);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.5s;
          svg { width: 20px; height: 20px; }
        }
        
        .user-info {
          min-width: 0; flex: 1;
          .user-email {
            font-size: 10px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 0.15em; color: oklch(var(--foreground) / 80%);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .user-role-box {
            display: flex; align-items: center; gap: 6px; margin-top: 6px; padding-top: 6px;
            border-top: 1px solid var(--border-color);
            
            .role-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); box-shadow: 0 0 8px var(--primary-color); }
            .role-text { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary-color); }
          }
        }
      }
    }

    .sidebar-container.collapsed {
      width: 96px; /* w-24 */
      .sidebar-footer .profile-pill { justify-content: center; padding: 8px; }
      
      .sidebar-header {
        .brand-row { display: none; }
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private auth = inject(AuthService);
  private notifService = inject(NotificationService);
  private router = inject(Router);

  unreadCount = signal(0);

  get user() { return this.auth.currentUser; }

  get initials(): string {
    const u = this.user;
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  }

  get visibleItems(): NavItem[] {
    const role = this.user?.role;
    return BASE_NAV.map(item => {
      if (item.route === '/vehicles' && role === 'ADMIN') {
        return { ...item, label: 'Fleet Overview' };
      }
      if (item.route === '/reservations' && role === 'ADMIN') {
        return { ...item, label: 'Booking Ledger' };
      }
      return item;
    }).filter(item => !item.roles || (role && item.roles.includes(role)));
  }

  ngOnInit() {
    this.loadUnreadCount();
  }

  loadUnreadCount() {
    if (!this.auth.isLoggedIn) return;
    this.notifService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count ?? 0),
      error: () => this.unreadCount.set(0)
    });
  }

  logout() {
    this.auth.logout();
  }

  navigateDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
