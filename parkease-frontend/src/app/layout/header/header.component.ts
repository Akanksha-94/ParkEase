import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="left">
        <button class="mobile-menu" (click)="toggleSidebar.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <div class="breadcrumb">
          <span class="segment root">Platform</span>
          <svg class="sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
          <span class="segment current">{{ currentRoute }}</span>
        </div>
      </div>

      <div class="right">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search systems...">
          <div class="shortcut">⌘K</div>
        </div>

        <div class="actions">
          <button class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            <span class="dot"></span>
          </button>
          
          <div class="profile" (click)="showMenu = !showMenu">
            <div class="avatar-ring">
              <div class="avatar">{{ initials }}</div>
            </div>
            
            <div class="menu glass" *ngIf="showMenu">
              <div class="menu-info">
                <span class="name">{{ user?.fullName || user?.email }}</span>
                <span class="role">{{ user?.role }}</span>
              </div>
              <div class="divider"></div>
              <button class="menu-item" (click)="navigate('/profile')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"></path>
                </svg>
                Account Settings
              </button>
              <button class="menu-item logout" (click)="logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"></path>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed; top: 0; right: 0; left: var(--sidebar-w);
      height: var(--header-h); background: hsla(222, 47%, 7%, 0.5);
      backdrop-filter: blur(20px); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; z-index: 150; transition: var(--trans);
    }

    .left { display: flex; align-items: center; gap: 24px; }
    
    .breadcrumb {
      display: flex; align-items: center; gap: 12px;
      .segment { font-size: 14px; font-weight: 600; }
      .root { color: var(--text-muted); }
      .current { color: var(--text-primary); }
      .sep { width: 12px; height: 12px; color: var(--text-muted); }
    }

    .right { display: flex; align-items: center; gap: 24px; }

    .search-box {
      position: relative; width: 320px;
      .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); }
      input {
        background: hsla(222, 47%, 12%, 0.5); border: 1px solid var(--border);
        border-radius: 12px; padding: 10px 48px 10px 48px; color: #fff;
        font-size: 14px; width: 100%; transition: var(--trans);
        &:focus { background: hsla(222, 47%, 15%, 0.8); border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
      }
      .shortcut {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        font-size: 10px; font-weight: 800; color: var(--text-muted);
        background: var(--bg-elevated); padding: 4px 6px; border-radius: 6px; border: 1px solid var(--border);
      }
    }

    .actions { display: flex; align-items: center; gap: 16px; }

    .action-btn {
      width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--border);
      background: transparent; color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: var(--trans);
      position: relative;
      &:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--primary); }
      svg { width: 20px; height: 20px; }
      .dot { position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; border: 2px solid var(--bg-base); }
    }

    .profile {
      position: relative; cursor: pointer;
      .avatar-ring {
        padding: 3px; border-radius: 15px; background: linear-gradient(135deg, var(--primary), var(--accent));
        .avatar {
          width: 38px; height: 38px; border-radius: 12px; background: var(--bg-surface);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; color: #fff; border: 2px solid var(--bg-base);
        }
      }
    }

    .menu {
      position: absolute; top: calc(100% + 16px); right: 0; width: 240px;
      padding: 12px; border-radius: var(--radius-lg); animation: menuIn 0.3s var(--ease);
      .menu-info {
        padding: 12px; display: flex; flex-direction: column;
        .name { font-size: 14px; font-weight: 700; color: #fff; }
        .role { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      }
      .menu-item {
        width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px;
        background: transparent; border: none; border-radius: 10px;
        color: var(--text-secondary); font-size: 14px; font-weight: 600;
        cursor: pointer; transition: var(--trans);
        svg { width: 18px; height: 18px; }
        &:hover { background: var(--bg-hover); color: var(--text-primary); }
        &.logout { color: #ef4444; &:hover { background: rgba(239, 44, 44, 0.1); } }
      }
    }

    @keyframes menuIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

    @media (max-width: 768px) {
      .header { left: 0; padding: 0 16px; }
      .search-box { display: none; }
      .breadcrumb { display: none; }
    }
  `]
})
export class HeaderComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  showMenu = false;

  get user() { return this.auth.currentUser; }
  get currentRoute() {
    const parts = this.router.url.split('/');
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1) || 'Overview';
  }

  get initials(): string {
    const u = this.user;
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  }

  navigate(path: string) {
    this.showMenu = false;
    this.router.navigate([path]);
  }

  logout() {
    this.auth.logout();
  }
}
