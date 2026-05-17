import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
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
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
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
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
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

          <!-- Admin-only: Send Alert button -->
          <button *ngIf="isAdmin()" class="alert-send-btn" (click)="openAlertModal()" title="Send Alert to Manager">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            <span>Send Alert</span>
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

    <!-- ═══════════════════════════════════════════
         Admin Send Alert Modal
    ═══════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showAlertModal" (click)="closeModal($event)">
      <div class="alert-modal glass" (click)="$event.stopPropagation()">

        <!-- Modal Header -->
        <div class="modal-head">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </div>
          <div>
            <h2>Send Alert</h2>
            <p>Broadcast a system message to a Manager</p>
          </div>
          <button class="close-btn" (click)="showAlertModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form -->
        <form (ngSubmit)="sendAlert()" #alertFormRef="ngForm">

          <!-- Recipient Dropdown (Instead of ID input) -->
          <div class="field-group">
            <label for="alertRecipientId">Select Manager</label>
            <div class="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <select
                id="alertRecipientId"
                name="recipientId"
                [(ngModel)]="alertForm.recipientId"
                required
              >
                <option [value]="null" disabled selected>-- Select a Manager --</option>
                <option *ngFor="let mgr of managers()" [value]="mgr.userId || mgr.id">
                  {{ mgr.fullName || mgr.email }} (ID: {{ mgr.userId || mgr.id }})
                </option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="field-group">
            <label for="alertTitle">Alert Title</label>
            <div class="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
              <input
                id="alertTitle"
                type="text"
                name="title"
                [(ngModel)]="alertForm.title"
                required
                placeholder="e.g. System Maintenance Notice"
              />
            </div>
          </div>

          <!-- Message -->
          <div class="field-group">
            <label for="alertMessage">Message</label>
            <textarea
              id="alertMessage"
              name="message"
              [(ngModel)]="alertForm.message"
              required
              rows="4"
              placeholder="Type your message here..."
            ></textarea>
          </div>

          <!-- Channel -->
          <div class="field-group">
            <label>Delivery Channel</label>
            <div class="channel-pills">
              <label class="channel-pill" [class.selected]="alertForm.channel === 'APP'">
                <input type="radio" name="channel" value="APP" [(ngModel)]="alertForm.channel"> 📱 In-App
              </label>
              <label class="channel-pill" [class.selected]="alertForm.channel === 'EMAIL'">
                <input type="radio" name="channel" value="EMAIL" [(ngModel)]="alertForm.channel"> 📧 Email
              </label>
              <label class="channel-pill" [class.selected]="alertForm.channel === 'SMS'">
                <input type="radio" name="channel" value="SMS" [(ngModel)]="alertForm.channel"> 💬 SMS
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="showAlertModal = false">Cancel</button>
            <button type="submit" class="btn-send" [disabled]="alertFormRef.invalid || sendingAlert()">
              <span *ngIf="!sendingAlert()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                Send Alert
              </span>
              <div *ngIf="sendingAlert()" class="loader"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
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
      max-width: 1350px;
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
        padding: 8px 12px;
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
        position: absolute; top: 0px; right: 0px;
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

    /* ── Admin Send Alert Button ─────────────────────── */
    .alert-send-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 99px;
      background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15));
      border: none; color: #fff;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: var(--trans); white-space: nowrap;
      box-shadow: 0 4px 14px oklch(60% 0.22 27 / 35%);
      svg { width: 16px; height: 16px; }
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px oklch(60% 0.22 27 / 50%); }
    }

    /* ── Modal Backdrop ──────────────────────────────── */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.2s ease;
    }

    /* ── Alert Modal Card ────────────────────────────── */
    .alert-modal {
      width: 100%; max-width: 520px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 28px; padding: 32px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.4);
      animation: slideUp 0.35s cubic-bezier(0.23,1,0.32,1);

      .modal-head {
        display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px;
        .modal-icon {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15));
          display: flex; align-items: center; justify-content: center;
          svg { width: 22px; height: 22px; color: #fff; }
        }
        h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
        p  { font-size: 13px; color: oklch(var(--foreground)/55%); margin: 0; }
        .close-btn {
          margin-left: auto; width: 36px; height: 36px; border-radius: 50%;
          background: oklch(var(--foreground)/5%); border: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--trans); flex-shrink: 0;
          svg { width: 16px; height: 16px; color: var(--text-muted); }
          &:hover { background: oklch(var(--foreground)/10%); }
        }
      }

      .field-group {
        margin-bottom: 20px;
        label {
          display: block; font-size: 12px; font-weight: 700;
          color: var(--text-primary); margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .input-wrap {
          position: relative;
          svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: oklch(var(--foreground)/40%); }
          input {
            width: 100%; padding: 13px 14px 13px 42px;
            background: oklch(var(--foreground)/4%); border: 1px solid var(--border-color);
            border-radius: 12px; color: var(--text-primary); font-size: 14px;
            transition: var(--trans);
            &::placeholder { color: oklch(var(--foreground)/25%); }
            &:focus { outline: none; border-color: oklch(65% 0.22 27); background: oklch(var(--foreground)/6%); }
          }
          select {
            width: 100%; padding: 13px 14px 13px 42px;
            background: oklch(var(--foreground)/4%); border: 1px solid var(--border-color);
            border-radius: 12px; color: var(--text-primary); font-size: 14px;
            transition: var(--trans); cursor: pointer;
            -webkit-appearance: none; -moz-appearance: none; appearance: none;
            &:focus { outline: none; border-color: oklch(65% 0.22 27); background: oklch(var(--foreground)/6%); }
            option { background: var(--bg-card); color: var(--text-primary); }
          }
        }
        textarea {
          width: 100%; padding: 13px 14px; resize: vertical;
          background: oklch(var(--foreground)/4%); border: 1px solid var(--border-color);
          border-radius: 12px; color: var(--text-primary); font-size: 14px;
          font-family: inherit; transition: var(--trans);
          &::placeholder { color: oklch(var(--foreground)/25%); }
          &:focus { outline: none; border-color: oklch(65% 0.22 27); background: oklch(var(--foreground)/6%); }
        }
      }

      .channel-pills {
        display: flex; gap: 8px;
        .channel-pill {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px; border-radius: 10px; cursor: pointer;
          border: 1.5px solid var(--border-color); font-size: 13px; font-weight: 600;
          color: oklch(var(--foreground)/60%); transition: var(--trans);
          input[type="radio"] { display: none; }
          &.selected { border-color: oklch(65% 0.22 27); background: oklch(65% 0.22 27 / 10%); color: oklch(65% 0.22 27); }
          &:hover:not(.selected) { background: oklch(var(--foreground)/5%); }
        }
      }

      .modal-actions {
        display: flex; gap: 12px; margin-top: 28px;
        .btn-cancel {
          flex: 1; padding: 13px; border-radius: 12px;
          background: oklch(var(--foreground)/5%); border: 1px solid var(--border-color);
          color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer;
          transition: var(--trans);
          &:hover { background: oklch(var(--foreground)/10%); }
        }
        .btn-send {
          flex: 2; padding: 13px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15));
          color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: var(--trans); display: flex; align-items: center; justify-content: center; gap: 8px;
          span { display: flex; align-items: center; gap: 8px; svg { width: 16px; height: 16px; } }
          &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px oklch(60% 0.22 27 / 40%); }
          &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        }
      }
    }

    .loader { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notifService = inject(NotificationService);
  private toast = inject(ToastService);
  public themeService = inject(ThemeService);

  showMenu = false;
  showAlertModal = false;
  sendingAlert = signal(false);
  unreadCount = signal(0);
  managers = signal<AuthUser[]>([]);

  alertForm = {
    recipientId: null as number | null,
    title: '',
    message: '',
    channel: 'APP' as 'APP' | 'EMAIL' | 'SMS'
  };

  isAdmin = computed(() => this.user()?.role === 'ADMIN');
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

  closeModal(event: Event) {
    this.showAlertModal = false;
  }

  openAlertModal() {
    this.showAlertModal = true;
    this.loadManagers();
  }

  loadManagers() {
    this.auth.getUsersByRole('MANAGER').subscribe({
      next: (res) => {
        this.managers.set(res.data || []);
      },
      error: () => {
        this.toast.error('Failed to retrieve Manager entities.');
      }
    });
  }

  sendAlert() {
    if (!this.alertForm.recipientId || !this.alertForm.title || !this.alertForm.message) return;
    this.sendingAlert.set(true);
    this.notifService.sendAlertToManager(
      this.alertForm.recipientId,
      this.alertForm.title,
      this.alertForm.message,
      this.alertForm.channel
    ).subscribe({
      next: () => {
        this.sendingAlert.set(false);
        this.showAlertModal = false;
        this.toast.success('Alert sent successfully to Manager!');
        this.alertForm = { recipientId: null, title: '', message: '', channel: 'APP' };
      },
      error: (err) => {
        this.sendingAlert.set(false);
        this.toast.error(err?.error?.message || 'Failed to send alert. Please try again.');
      }
    });
  }
}
