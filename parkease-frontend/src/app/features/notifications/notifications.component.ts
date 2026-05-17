import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

          <div class="feed-actions" style="opacity: 1; transform: translateX(0);">
            <button *ngIf="n.type === 'SYSTEM' && isManagerOrAdmin" 
                    (click)="openReplyModal($event, n)"
                    style="margin-right: 12px; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: 99px; background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15)); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px oklch(60% 0.22 27 / 35%);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Reply
            </button>
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
    
    <!-- ═══════════════════════════════════════════
         Reply Directive Modal
    ═══════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showReplyModal" (click)="showReplyModal = false">
      <div class="reply-modal glass" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          </div>
          <div>
            <h2>Transmit Reply</h2>
            <p>Establish secure uplink to origin.</p>
          </div>
          <button class="close-btn" (click)="showReplyModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form (ngSubmit)="sendReply()" #replyFormRef="ngForm">
          <div class="field-group">
            <label>Subject</label>
            <div class="input-wrap">
              <input type="text" name="title" [(ngModel)]="replyForm.title" required>
            </div>
          </div>
          <div class="field-group">
            <label>Response</label>
            <textarea name="message" [(ngModel)]="replyForm.message" required rows="4" placeholder="Enter directive payload..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="showReplyModal = false">Abort</button>
            <button type="submit" class="btn-send" [disabled]="replyFormRef.invalid || sendingReply()">
              <span *ngIf="!sendingReply()">⚡ Send Reply</span>
              <div *ngIf="sendingReply()" class="loader"></div>
            </button>
          </div>
        </form>
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

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.2s ease;
    }
    
    /* Reply Modal Card */
    .reply-modal {
      width: 100%; max-width: 520px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 28px; padding: 32px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.4);
      animation: slideUp 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    .modal-head { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
    .modal-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15));
      display: flex; align-items: center; justify-content: center;
      svg { width: 22px; height: 22px; color: #fff; }
    }
    .modal-head h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
    .modal-head p  { font-size: 13px; color: oklch(var(--foreground)/55%); margin: 0; }
    .close-btn {
      margin-left: auto; width: 36px; height: 36px; border-radius: 50%;
      background: oklch(var(--foreground)/5%); border: 1px solid var(--border-color);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: var(--trans); flex-shrink: 0;
      svg { width: 16px; height: 16px; color: var(--text-muted); }
      &:hover { background: oklch(var(--foreground)/10%); }
    }
    
    .field-group { margin-bottom: 20px; }
    .field-group label {
      display: block; font-size: 12px; font-weight: 700;
      color: var(--text-primary); margin-bottom: 8px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .input-wrap input, .field-group textarea {
      width: 100%; padding: 13px 14px;
      background: oklch(var(--foreground)/4%); border: 1px solid var(--border-color);
      border-radius: 12px; color: var(--text-primary); font-size: 14px;
      font-family: inherit; transition: var(--trans);
      &::placeholder { color: oklch(var(--foreground)/25%); }
      &:focus { outline: none; border-color: oklch(65% 0.22 27); background: oklch(var(--foreground)/6%); }
    }
    
    .modal-actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn-cancel {
      flex: 1; padding: 13px; border-radius: 12px;
      background: oklch(var(--foreground)/5%); border: 1px solid var(--border-color);
      color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer; transition: var(--trans);
      &:hover { background: oklch(var(--foreground)/10%); }
    }
    .btn-send {
      flex: 2; padding: 13px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, oklch(65% 0.22 27), oklch(55% 0.24 15));
      color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
      transition: var(--trans); display: flex; align-items: center; justify-content: center; gap: 8px;
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px oklch(60% 0.22 27 / 40%); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }
    .loader { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

  `]
})
export class NotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  currentTime = signal<number>(new Date().getTime());

  showReplyModal = false;
  sendingReply = signal(false);
  activeReplyNotification = signal<Notification | null>(null);
  replyForm = { title: '', message: '' };

  get isManagerOrAdmin(): boolean {
    const role = this.auth.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

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

  openReplyModal(e: Event, n: Notification) {
    e.stopPropagation();
    this.activeReplyNotification.set(n);
    this.replyForm = { title: `Re: ${n.title}`, message: '' };
    this.showReplyModal = true;
  }

  sendReply() {
    const notif = this.activeReplyNotification();
    if (!notif || !notif.relatedId) {
      this.toast.error('Unable to establish secure uplink to sender.');
      return;
    }
    
    this.sendingReply.set(true);
    
    // Sender context (Manager replying)
    const senderId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id;
    const senderRole = this.auth.currentUser?.role;

    this.notifService.sendNotification({
      recipientId: notif.relatedId,
      type: 'SYSTEM',
      title: this.replyForm.title,
      message: this.replyForm.message,
      channel: 'APP',
      relatedId: senderId ? Number(senderId) : undefined,
      relatedType: senderRole || undefined
    }).subscribe({
      next: () => {
        this.sendingReply.set(false);
        this.showReplyModal = false;
        this.toast.success('Reply directive transmitted successfully!');
      },
      error: (err) => {
        this.sendingReply.set(false);
        this.toast.error(err?.error?.message || 'Transmission failed.');
      }
    });
  }
}
