import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Operational Feed</h2>
        <p>Real-time telemetry and system synchronization events.</p>
      </div>
      <div class="header-actions">
        <span class="unread-pill" *ngIf="unreadCount() > 0">{{ unreadCount() }} unread</span>
        <button class="btn btn-secondary" (click)="markAllRead()" *ngIf="notifications().length > 0">
          Clear All Signal
        </button>
      </div>
    </div>

    <div class="page-content animate-in">
      <div class="notification-container glass">
        <div *ngFor="let n of notifications()"
             class="notification-entry"
             [class.unread]="!n.read"
             (click)="markAsRead(n)">

          <div class="indicator">
            <div class="dot" *ngIf="!n.read"></div>
          </div>

          <div class="event-icon" [ngSwitch]="n.type">
            <svg *ngSwitchCase="'BOOKING'" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
            <svg *ngSwitchCase="'CHECKIN'" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <svg *ngSwitchCase="'CHECKOUT'" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg>
            <svg *ngSwitchCase="'BOOKING_CONFIRMED'" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
            <svg *ngSwitchCase="'BOOKING_CANCELLED'" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <svg *ngSwitchCase="'PAYMENT_SUCCESS'" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg>
            <svg *ngSwitchCase="'PAYMENT_FAILED'" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <svg *ngSwitchCase="'REMINDER'" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"></path></svg>
          </div>

          <div class="event-details">
            <div class="header-row">
              <span class="title">{{ n.title }}</span>
              <span class="timestamp">{{ n.createdAt | date:'MMM d, HH:mm' }}</span>
            </div>
            <p class="message">{{ n.message }}</p>
            <span class="type-badge">{{ n.type.replace('_', ' ') }}</span>
          </div>

          <div class="entry-actions">
            <button class="icon-btn delete-btn" title="Delete" (click)="deleteNotification($event, n.notificationId)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
            </button>
          </div>
        </div>

        <div *ngIf="notifications().length === 0" class="empty-state p-20">
          <div class="radar-box">
            <div class="ring"></div>
            <div class="ring"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"></path></svg>
          </div>
          <h3>System Clear</h3>
          <p>No active signals detected in your current sector.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .unread-pill { background: hsla(var(--p-primary), 0.15); border: 1px solid hsla(var(--p-primary), 0.3); color: var(--primary); font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }
    .notification-container { padding: 0; overflow: hidden; border-radius: var(--radius-lg); }

    .notification-entry {
      display: flex; align-items: center; gap: 20px; padding: 20px 28px; border-bottom: 1px solid var(--border);
      cursor: pointer; transition: var(--trans); position: relative;
      &:hover { background: hsla(255, 255%, 255%, 0.03); .entry-actions { opacity: 1; } }
      &.unread { background: hsla(var(--p-primary), 0.04); .title { color: #fff; font-weight: 800; } }
      &:last-child { border-bottom: none; }
    }

    .indicator {
      width: 12px; display: flex; justify-content: center; flex-shrink: 0;
      .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 10px var(--primary); }
    }

    .event-icon {
      width: 44px; height: 44px; border-radius: 12px; background: hsla(255, 255%, 255%, 0.03); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 20px; height: 20px; }
    }

    .event-details {
      flex: 1; min-width: 0;
      .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .title { font-size: 14px; color: var(--text-secondary); transition: var(--trans); }
      .timestamp { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; flex-shrink: 0; margin-left: 12px; }
      .message { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 8px; }
      .type-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--primary); background: hsla(var(--p-primary), 0.1); padding: 2px 8px; border-radius: 4px; }
    }

    .entry-actions {
      opacity: 0; transition: var(--trans); flex-shrink: 0;
      .icon-btn { background: transparent; border: 1px solid var(--border); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--trans); svg { width: 14px; height: 14px; } }
      .delete-btn { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); border-color: hsl(var(--danger)); } }
    }

    .radar-box {
      position: relative; width: 120px; height: 120px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);
      svg { width: 40px; height: 40px; position: relative; z-index: 1; }
      .ring { position: absolute; inset: 0; border: 1px solid var(--primary); border-radius: 50%; opacity: 0; animation: radar 3s infinite; &:nth-child(2) { animation-delay: 1.5s; } }
    }

    .p-20 { padding: 80px; text-align: center; }

    @keyframes radar { from { transform: scale(0.5); opacity: 0.5; } to { transform: scale(1.5); opacity: 0; } }
  `]
})
export class NotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notifService.getMyNotifications().subscribe({
      next: ns => {
        this.notifications.set(ns);
        this.unreadCount.set(ns.filter(n => !n.read).length);
      },
      error: () => this.notifications.set([])
    });
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
