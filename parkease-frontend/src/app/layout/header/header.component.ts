import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { interval } from 'rxjs';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header-container">
      <div class="header-pill glass">
        <!-- Logo -->
        <div class="logo-section" (click)="navigate('/dashboard')">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <span class="logo-text">ParkEase</span>
        </div>

        <!-- Navigation -->
        <nav class="nav-section">
          @for (item of visibleNavItems(); track item.route) {
            <a [routerLink]="item.route" 
               routerLinkActive="active"
               class="nav-item">
              {{ item.label }}
            </a>
          }
        </nav>

        <!-- Actions -->
        <div class="actions-section">
          <button class="icon-btn glass-hover" (click)="navigate('/profile')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
          </button>

          <button class="icon-btn glass-hover" (click)="navigate('/notifications')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            <div class="notification-dot" *ngIf="unreadCount() > 0">
              {{ unreadCount() > 99 ? '99+' : unreadCount() }}
            </div>
          </button>

          <button class="icon-btn glass-hover theme-toggle" (click)="themeService.toggleTheme()">
            <svg *ngIf="themeService.isDarkMode()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22 4.22l1.42 1.42"/><line x1="18.36 18.36l1.42 1.42"/><line x1="1 12h2"/><line x1="21 12h2"/><line x1="4.22 19.78l1.42-1.42"/><line x1="18.36 5.64l1.42-1.42"/></svg>
            <svg *ngIf="!themeService.isDarkMode()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>

          <div class="profile-section">
            <div class="profile-trigger" (click)="showMenu = !showMenu">
              <div class="profile-avatar-wrap">
                <img *ngIf="user()?.profilePicture" [src]="user()?.profilePicture" class="avatar-img" alt="User">
                <span *ngIf="!user()?.profilePicture" class="avatar-initials">{{ initials() }}</span>
              </div>
              <svg class="chevron" [class.open]="showMenu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            
            <!-- Dropdown Menu -->
            <div class="menu glass" *ngIf="showMenu">
              <div class="menu-header">
                <div class="header-avatar">
                  <img *ngIf="user()?.profilePicture" [src]="user()?.profilePicture" class="avatar-img" alt="User">
                  <span *ngIf="!user()?.profilePicture" class="avatar-initials">{{ initials() }}</span>
                </div>
                <div class="header-info">
                  <span class="name">{{ user()?.fullName || user()?.email }}</span>
                  <span class="role">{{ user()?.role }}</span>
                </div>
              </div>
              
              <div class="menu-content">
                <button class="menu-item" (click)="navigate('/profile')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"/></svg>
                  My Profile
                </button>
                <div class="divider"></div>
                <button class="menu-item logout" (click)="logout()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      position: fixed;
      top: 24px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 1000;
      padding: 0 24px;
      pointer-events: none;
    }

    .header-pill {
      pointer-events: auto;
      width: 100%;
      max-width: 1100px;
      height: 64px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px 0 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
      transition: var(--trans);
      backdrop-filter: blur(12px);
    }

    /* Logo Section */
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      .logo-icon {
        width: 36px; height: 36px; border-radius: 10px;
        background: var(--text-primary); color: var(--bg-base);
        display: flex; align-items: center; justify-content: center;
        svg { width: 20px; height: 20px; }
      }
      .logo-text { font-family: var(--font-heading); font-weight: 800; font-size: 18px; color: var(--text-primary); }
    }

    /* Navigation Section */
    .nav-section {
      display: flex;
      align-items: center;
      gap: 4px;
      background: oklch(var(--foreground) / 3%);
      padding: 4px;
      border-radius: 99px;
      
      .nav-item {
        padding: 8px 16px;
        border-radius: 99px;
        font-size: 14px;
        font-weight: 600;
        color: oklch(var(--foreground) / 60%);
        text-decoration: none;
        transition: var(--trans);
        white-space: nowrap;
        
        &:hover { color: var(--text-primary); background: oklch(var(--foreground) / 5%); }
        &.active { background: var(--text-primary); color: var(--bg-base); box-shadow: 0 4px 12px oklch(var(--foreground) / 10%); }
      }
    }

    /* Actions Section */
    .actions-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 99px;
      background: oklch(var(--foreground) / 3%);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--trans);
      svg { width: 18px; height: 18px; }
      &:hover { background: oklch(var(--foreground) / 8%); }
    }

    .icon-btn {
      width: 44px; height: 44px; border-radius: 50%;
      background: oklch(var(--foreground) / 3%);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; transition: var(--trans);
      svg { width: 20px; height: 20px; }
      &:hover { background: oklch(var(--foreground) / 8%); }
      
      .notification-dot {
        position: absolute; top: -4px; right: -4px;
        min-width: 18px; height: 18px; border-radius: 99px;
        background: #facc15; color: #000;
        border: 2px solid var(--bg-card);
        font-size: 10px; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        padding: 0 4px;
      }
    }

    .profile-section { position: relative; }
    .profile-trigger {
      display: flex; align-items: center; gap: 10px; padding: 4px 12px 4px 4px; border-radius: 99px;
      background: oklch(var(--foreground) / 3%); border: 1px solid var(--border-color); cursor: pointer; transition: 0.3s;
      &:hover { background: oklch(var(--foreground) / 8%); border-color: oklch(var(--foreground) / 15%); }
      .profile-avatar-wrap { width: 36px; height: 36px; border-radius: 50%; background: var(--text-primary); color: var(--bg-base); display: flex; align-items: center; justify-content: center; overflow: hidden; .avatar-img { width: 100%; height: 100%; object-fit: cover; } .avatar-initials { font-size: 12px; font-weight: 900; } }
      .chevron { width: 14px; height: 14px; color: var(--text-muted); transition: 0.3s; &.open { transform: rotate(180deg); } }
    }

    .menu {
      position: absolute; top: calc(100% + 12px); right: 0; width: 260px;
      padding: 0; border-radius: 24px; background: var(--bg-card); border: 1px solid var(--border-color);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); backdrop-filter: blur(32px); overflow: hidden;
      animation: menuIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      
      .menu-header {
        padding: 24px; background: oklch(var(--foreground) / 3%); display: flex; align-items: center; gap: 16px;
        .header-avatar { width: 48px; height: 48px; border-radius: 16px; background: var(--text-primary); color: var(--bg-base); display: flex; align-items: center; justify-content: center; overflow: hidden; .avatar-img { width: 100%; height: 100%; object-fit: cover; } .avatar-initials { font-size: 16px; font-weight: 900; } }
        .header-info { display: flex; flex-direction: column; gap: 2px; .name { font-size: 15px; font-weight: 800; color: var(--text-primary); } .role { font-size: 10px; font-weight: 900; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px; } }
      }
      
      .menu-content {
        padding: 8px;
        .menu-item {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          background: transparent; border: none; border-radius: 16px; color: var(--text-primary);
          font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s;
          svg { width: 18px; height: 18px; color: var(--text-muted); }
          &:hover { background: oklch(var(--foreground) / 5%); svg { color: var(--text-primary); } }
          &.logout { color: #ef4444; svg { color: #ef4444; } &:hover { background: oklch(var(--danger-raw) / 10%); } }
        }
        .divider { height: 1px; background: var(--border-color); margin: 8px 12px; }
      }
    }

    @keyframes menuIn { from { opacity: 0; transform: translateY(12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

    @media (max-width: 900px) {
      .nav-section { display: none; }
      .header-pill { max-width: 100%; }
    }
  `]
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notifService = inject(NotificationService);
  public themeService = inject(ThemeService);

  showMenu = false;
  unreadCount = signal(0);
  user = signal(this.auth.currentUser);

  navItems = signal<NavItem[]>([
    { label: 'Dashboard', route: '/dashboard', icon: '' },
    { label: 'Lots', route: '/parking-lots', icon: '', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Spots', route: '/parking-spots', icon: '', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Reservations', route: '/reservations', icon: '' },
    { label: 'Vehicles', route: '/vehicles', icon: '' },
    { label: 'Payments', route: '/payments', icon: '' },
    { label: 'Analytics', route: '/analytics', icon: '', roles: ['ADMIN', 'MANAGER'] }
  ]);

  visibleNavItems = computed(() => {
    const role = this.user()?.role;
    return this.navItems()
      .filter(item => !item.roles || (role && item.roles.includes(role)))
      .map(item => {
        let label = item.label;
        if (item.route === '/vehicles' && role === 'ADMIN') label = 'Fleet Overview';
        if (item.route === '/reservations' && role === 'ADMIN') label = 'Booking Ledger';
        return { ...item, label };
      });
  });

  initials = computed(() => {
    const u = this.user();
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  });

  constructor() {
    // Keep the local user signal in sync with AuthService
    this.auth.user$.subscribe(user => {
      this.user.set(user);
      if (user) {
        this.loadUnreadCount();
      } else {
        this.unreadCount.set(0);
      }
    });

    // Poll for unread notifications every 10 seconds
    interval(10000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  loadUnreadCount() {
    if (!this.auth.isLoggedIn) return;
    this.notifService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count ?? 0),
      error: () => this.unreadCount.set(0)
    });
  }

  navigate(path: string) {
    this.showMenu = false;
    this.router.navigate([path]);
  }

  logout() {
    this.auth.logout();
  }
}
