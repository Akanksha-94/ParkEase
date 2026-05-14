import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
  badge?: number;
}

const BASE_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'M4 4h6v8H4V4zm10 0h6v5h-6V4zm-10 10h6v6H4v-6zm10-3h6v9h-6v-9z' },
  { label: 'Parking Lots', route: '/parking-lots', icon: 'M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10' },
  { label: 'Parking Spots', route: '/parking-spots', icon: 'M9 20l-5-5 5-5M15 4l5 5-5 5' },
  { label: 'Reservations', route: '/reservations', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'My Vehicles', route: '/vehicles', icon: 'M7 17a2 2 0 002 2h10a2 2 0 002-2M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { label: 'Payments', route: '/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.646 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.646-1M12 16a3.332 3.332 0 01-2.646-1m5.292 0a3.332 3.332 0 00-2.646 1' },
  { label: 'Notifications', route: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { label: 'Analytics', route: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Profile', route: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-brand">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div class="brand-info" *ngIf="!collapsed">
          <span class="brand-name">ParkEase</span>
          <span class="brand-sub">Platform v2.0</span>
        </div>
      </div>

      <nav class="nav-section">
        <a *ngFor="let item of visibleItems"
           class="nav-link"
           [routerLink]="item.route"
           routerLinkActive="active"
           [title]="collapsed ? item.label : ''">
          <div class="icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="item.icon"></path>
            </svg>
            <!-- Notification unread badge -->
            <span class="nav-badge" *ngIf="item.label === 'Notifications' && unreadCount() > 0">
              {{ unreadCount() > 99 ? '99+' : unreadCount() }}
            </span>
          </div>
          <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
          <span class="inline-badge" *ngIf="!collapsed && item.label === 'Notifications' && unreadCount() > 0">
            {{ unreadCount() }}
          </span>
          <div class="active-indicator"></div>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-block">
          <div class="avatar">{{ initials }}</div>
          <div class="details" *ngIf="!collapsed">
            <span class="name">{{ user?.fullName || user?.firstName || user?.email }}</span>
            <span class="role">{{ user?.role }}</span>
          </div>
        </div>
        <button class="toggle-btn" (click)="toggleCollapse.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [style.transform]="collapsed ? 'rotate(180deg)' : ''">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      width: var(--sidebar-w); z-index: 200;
      background: hsla(222, 47%, 9%, 0.85);
      backdrop-filter: blur(20px);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-brand {
      padding: 24px; display: flex; align-items: center; gap: 14px;
      .logo {
        width: 40px; height: 40px; border-radius: 12px;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        display: flex; align-items: center; justify-content: center;
        color: #fff; box-shadow: 0 8px 20px var(--primary-glow); flex-shrink: 0;
        svg { width: 22px; height: 22px; }
      }
      .brand-info {
        display: flex; flex-direction: column;
        .brand-name { font-family: 'Outfit'; font-size: 1.25rem; font-weight: 800; color: #fff; line-height: 1; }
        .brand-sub { font-size: 10px; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
      }
    }

    .nav-section {
      flex: 1; padding: 20px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto;
    }

    .nav-link {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: var(--radius-md); color: var(--text-secondary);
      text-decoration: none; transition: var(--trans); position: relative;

      .icon-box {
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        border-radius: 8px; border: 1px solid transparent; transition: var(--trans); position: relative; flex-shrink: 0;
        svg { width: 18px; height: 18px; }
      }

      .label { font-size: 14px; font-weight: 600; flex: 1; }

      .nav-badge {
        position: absolute; top: -4px; right: -4px; background: #ef4444;
        color: #fff; font-size: 9px; font-weight: 900; min-width: 16px; height: 16px;
        border-radius: 99px; display: flex; align-items: center; justify-content: center;
        padding: 0 4px; border: 2px solid var(--bg-base); box-shadow: 0 0 8px rgba(239,68,68,0.5);
      }

      .inline-badge {
        background: #ef4444; color: #fff; font-size: 10px; font-weight: 900;
        min-width: 20px; height: 20px; border-radius: 99px; display: flex;
        align-items: center; justify-content: center; padding: 0 5px;
        box-shadow: 0 0 8px rgba(239,68,68,0.4);
      }

      &:hover {
        background: hsla(var(--p-primary), 0.08); color: var(--text-primary);
        .icon-box { border-color: hsla(var(--p-primary), 0.2); background: hsla(var(--p-primary), 0.1); }
      }

      &.active {
        background: hsla(var(--p-primary), 0.12); color: var(--primary);
        .icon-box { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 4px 12px var(--primary-glow); }
        .active-indicator { opacity: 1; transform: scaleY(1); }
      }
    }

    .active-indicator {
      position: absolute; right: 0; top: 10px; bottom: 10px; width: 3px;
      background: var(--primary); border-radius: 4px 0 0 4px; opacity: 0;
      transform: scaleY(0.4); transition: var(--trans); box-shadow: 0 0 15px var(--primary);
    }

    .sidebar-footer {
      padding: 20px; border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      .user-block {
        display: flex; align-items: center; gap: 12px; min-width: 0;
        .avatar {
          width: 40px; height: 40px; border-radius: 12px;
          background: var(--bg-elevated); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; border: 1px solid var(--border); flex-shrink: 0;
        }
        .details {
          display: flex; flex-direction: column; min-width: 0;
          .name { font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .role { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
        }
      }
    }

    .toggle-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-surface); color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: var(--trans); flex-shrink: 0;
      &:hover { color: var(--primary); border-color: var(--primary); background: var(--bg-hover); }
      svg { width: 18px; height: 18px; transition: var(--trans); }
    }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private auth = inject(AuthService);
  private notifService = inject(NotificationService);

  unreadCount = signal(0);

  get user() { return this.auth.currentUser; }

  get initials(): string {
    const u = this.user;
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  }

  get visibleItems(): NavItem[] {
    return BASE_NAV;
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
}
