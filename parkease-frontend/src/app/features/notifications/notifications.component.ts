import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header glass animate-in" style="padding: 32px; border-radius: 32px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap;">
      <div>
        <h2 class="header-title">Operational Feed</h2>
        <p class="header-subtitle">Real-time telemetry and system synchronization events.</p>
      </div>
      <div class="header-actions">
        <div class="unread-badge" *ngIf="unreadCount() > 0">
          <span class="count">{{ unreadCount() }}</span>
          <span class="label">UNREAD SIGNALS</span>
        </div>
        <button class="zenith-btn danger" (click)="markAllRead()" *ngIf="notifications().length > 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          Purge All
        </button>
      </div>
    </div>

    <div class="page-content animate-in">
      <div class="feed-grid">
        <div *ngFor="let n of notifications()"
             class="feed-card glass"
             [class.is-unread]="!n.read"
             (click)="markAsRead(n)">
          
          <div class="card-status-dot" *ngIf="!n.read"></div>
          
          <div class="feed-icon-wrap" [attr.data-type]="n.type">
            <div class="icon-inner" [ngSwitch]="n.type">
              <svg *ngSwitchCase="'BOOKING'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <svg *ngSwitchCase="'CHECKIN'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg *ngSwitchCase="'CHECKOUT'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <svg *ngSwitchCase="'BOOKING_CONFIRMED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              <svg *ngSwitchCase="'BOOKING_CANCELLED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <svg *ngSwitchCase="'PAYMENT_SUCCESS'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <svg *ngSwitchCase="'PAYMENT_FAILED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <svg *ngSwitchCase="'REMINDER'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
          </div>

          <div class="feed-content">
            <div class="feed-meta">
              <span class="feed-type" [attr.data-type]="n.type">{{ (n.type || 'SYSTEM').replace('_', ' ') }}</span>
              <span class="feed-time">
                <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ formatTimeAgo(n.sentAt || n.createdAt) }}
              </span>
            </div>
            <h4 class="feed-title">{{ n.title }}</h4>
            <p class="feed-message">{{ n.message }}</p>
          </div>

          <div class="feed-actions">
            <button class="icon-btn-danger" (click)="deleteNotification($event, n.notificationId)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div *ngIf="notifications().length === 0" class="empty-feed glass animate-in">
          <div class="radar-scan">
            <div class="scan-ring"></div>
            <div class="scan-ring"></div>
            <div class="scan-ring"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3>Telemetry Clear</h3>
          <p>The operational grid is currently silent. No new synchronization events detected.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-title { font-size: 42px; font-weight: 900; letter-spacing: -2px; color: var(--text-primary); margin: 0; }
    .header-subtitle { color: var(--text-muted); margin-top: 8px; font-size: 15px; }
    
    .unread-badge { 
      display: flex; align-items: center; gap: 10px; padding: 8px 18px; 
      background: oklch(var(--primary) / 10%); border: 1px solid oklch(var(--primary) / 20%); border-radius: 100px;
      .count { font-size: 18px; font-weight: 900; color: var(--primary-color); text-shadow: 0 0 12px oklch(var(--primary) / 40%); }
      .label { font-size: 10px; font-weight: 900; color: var(--primary-color); letter-spacing: 1.5px; }
    }

    .feed-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 2rem; }
    
    .feed-card {
      display: flex; gap: 24px; padding: 28px 36px; border-radius: 32px; cursor: pointer; transition: 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-card); backdrop-filter: blur(20px);
      
      &:hover { 
        transform: translateX(12px) scale(1.01); 
        background: var(--bg-hover); 
        border-color: oklch(var(--primary) / 30%);
        box-shadow: 0 20px 40px -20px oklch(var(--primary-glow-raw) / 20%);
        .feed-actions { opacity: 1; transform: translateX(0); } 
      }
      &.is-unread { border-left: 6px solid var(--primary-color); background: oklch(var(--primary) / 5%); }
    }

    .card-status-dot { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 50%; background: var(--primary-color); box-shadow: 0 0 15px var(--primary-color); }

    .feed-icon-wrap {
      width: 60px; height: 60px; flex-shrink: 0;
      .icon-inner { 
        width: 100%; height: 100%; border-radius: 20px; background: oklch(var(--foreground) / 5%); 
        display: flex; align-items: center; justify-content: center; color: var(--text-muted); 
        transition: 0.3s; svg { width: 28px; height: 28px; } 
      }
      
      &[data-type="BOOKING"], &[data-type="BOOKING_CONFIRMED"], &[data-type="PAYMENT_SUCCESS"] { .icon-inner { color: #10b981; background: rgba(16, 185, 129, 0.1); } }
      &[data-type="CHECKIN"], &[data-type="REMINDER"] { .icon-inner { color: #00d4ff; background: rgba(0, 212, 255, 0.1); } }
      &[data-type="CHECKOUT"] { .icon-inner { color: #f59e0b; background: rgba(245, 158, 11, 0.1); } }
      &[data-type="BOOKING_CANCELLED"], &[data-type="PAYMENT_FAILED"] { .icon-inner { color: #ef4444; background: rgba(239, 68, 68, 0.1); } }
    }

    .feed-content {
      flex: 1;
      .feed-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
      .feed-type { 
        font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 4px 10px; border-radius: 6px; background: oklch(var(--foreground) / 5%); color: var(--text-muted);
        &[data-type="BOOKING"], &[data-type="BOOKING_CONFIRMED"], &[data-type="PAYMENT_SUCCESS"] { color: #10b981; background: rgba(16, 185, 129, 0.05); }
        &[data-type="CHECKIN"], &[data-type="REMINDER"] { color: #00d4ff; background: rgba(0, 212, 255, 0.05); }
        &[data-type="CHECKOUT"] { color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
        &[data-type="BOOKING_CANCELLED"], &[data-type="PAYMENT_FAILED"] { color: #ef4444; background: rgba(239, 68, 68, 0.05); }
      }
      .feed-time { 
        font-size: 11px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;
        .time-icon { width: 13px; height: 13px; color: var(--text-muted); display: inline-block; }
      }
      .feed-title { font-size: 18px; font-weight: 900; color: var(--text-primary); margin: 0 0 6px; letter-spacing: -0.5px; }
      .feed-message { font-size: 15px; color: var(--text-muted); margin: 0; line-height: 1.6; font-weight: 500; }
    }

    .feed-actions {
      opacity: 0; transform: translateX(20px); transition: 0.4s cubic-bezier(0.23, 1, 0.32, 1); display: flex; align-items: center;
      .icon-btn-danger { 
        width: 44px; height: 44px; border-radius: 14px; border: 1px solid oklch(var(--foreground) / 10%); background: transparent; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; 
        &:hover { background: #ef4444; color: #fff; transform: rotate(90deg) scale(1.1); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); } 
        svg { width: 20px; height: 20px; } 
      }
    }

    .empty-feed {
      padding: 120px 40px; text-align: center; border-radius: 40px;
      .radar-scan {
        width: 160px; height: 160px; margin: 0 auto 40px; position: relative; display: flex; align-items: center; justify-content: center; color: var(--text-muted);
        svg { width: 56px; height: 56px; position: relative; z-index: 5; opacity: 0.4; }
        .scan-ring { position: absolute; inset: 0; border: 1.5px solid var(--primary-color); border-radius: 50%; opacity: 0; animation: scan 4s infinite cubic-bezier(0, 0, 0.2, 1); &:nth-child(2) { animation-delay: 1s; } &:nth-child(3) { animation-delay: 2s; } }
      }
      h3 { font-size: 28px; font-weight: 900; margin-bottom: 16px; color: var(--text-primary); }
      p { font-size: 16px; color: var(--text-muted); max-width: 440px; margin: 0 auto; line-height: 1.7; font-weight: 500; }
    }

    @keyframes scan { 0% { transform: scale(0.4); opacity: 0; } 20% { opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
  `]
})
export class NotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  currentTime = signal<number>(new Date().getTime());

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loadNotifications();
    
    // Refresh backend notifications every 10 seconds
    interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadNotifications());

    // Update real-time relative clock every 5 seconds to keep relative times ticking forward
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.currentTime.set(new Date().getTime()));
  }

  loadNotifications() {
    this.notifService.getMyNotifications().subscribe({
      next: ns => {
        // Force sort newest to top using ISO string comparison
        const sorted = [...ns].sort((a, b) => {
          return (b.notificationId || 0) - (a.notificationId || 0);
        });
        this.notifications.set(sorted);
        this.unreadCount.set(ns.filter(n => !n.read).length);
      },
      error: () => this.notifications.set([])
    });
  }

  formatTimeAgo(dateStr: string | undefined): string {
    if (!dateStr) return 'just now';
    
    // Force parse ISO format or simple Spring Boot formats correctly
    const parsedDate = new Date(dateStr);
    const date = parsedDate.getTime();
    if (isNaN(date)) return 'just now';

    const now = this.currentTime();
    const diffMs = now - date;
    
    // Fallback if future date (due to local and server timezone skew)
    if (diffMs < 0) return 'just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    }
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) {
      return `${diffHrs} h ago`;
    }
    
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'day'} ago`;
  }

  markAsRead(n: Notification) {
    if (n.read) return;
    this.notifService.markAsRead(n.notificationId).subscribe(() => this.loadNotifications());
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe({
      next: () => {
        this.toast.success('All notifications marked as read');
        this.loadNotifications();
      },
      error: () => this.toast.error('Failed to mark all as read')
    });
  }

  deleteNotification(e: Event, id: number) {
    e.stopPropagation();
    this.notifService.delete(id).subscribe({
      next: () => {
        this.toast.success('Notification removed');
        this.loadNotifications();
      },
      error: () => this.toast.error('Failed to delete notification')
    });
  }
}
