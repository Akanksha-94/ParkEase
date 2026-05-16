import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReservationService, Reservation } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="zenith-container animate-in" *ngIf="res()">
      <header class="details-header">
        <button class="back-btn" routerLink="/reservations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="header-main">
          <div class="id-badge">BOOKING #{{ res()?.bookingId }}</div>
          <h1 class="details-title">Session Intelligence</h1>
        </div>
        <div class="header-actions">
          <span class="status-pill" [attr.data-status]="res()?.status">{{ res()?.status }}</span>
        </div>
      </header>

      <div class="details-grid">
        <!-- Main Stats Panel -->
        <div class="panel main-panel glass">
          <div class="panel-section">
            <h3 class="section-title">Core Timeline</h3>
            <div class="timeline-viz">
              <div class="time-node">
                <span class="lab">AUTHORIZATION</span>
                <span class="val">{{ res()?.startTime | date:'MMM d, yyyy' }}</span>
                <span class="sub">{{ res()?.startTime | date:'h:mm a' }}</span>
              </div>
              <div class="time-bridge" [class.active]="res()?.status === 'ACTIVE'">
                <div class="bridge-fill" [style.width.%]="progress()"></div>
              </div>
              <div class="time-node end">
                <span class="lab">EXPIRATION</span>
                <span class="val">{{ res()?.endTime | date:'MMM d, yyyy' }}</span>
                <span class="sub">{{ res()?.endTime | date:'h:mm a' }}</span>
              </div>
            </div>
          </div>

          <div class="panel-section grid grid-cols-2 gap-8 mt-8">
            <div class="info-group">
              <label>Parking Infrastructure</label>
              <div class="info-card">
                <div class="icon-box lot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                <div class="card-content">
                  <span class="val">{{ res()?.lotName || 'Primary Zone' }}</span>
                  <span class="sub">Lot ID: {{ res()?.lotId }}</span>
                </div>
              </div>
            </div>
            <div class="info-group">
              <label>Allocated Bay</label>
              <div class="info-card">
                <div class="icon-box spot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
                <div class="card-content">
                  <span class="val">Bay {{ res()?.spotNumber || 'Auto-Allocated' }}</span>
                  <span class="sub">Spot ID: {{ res()?.spotId }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Panel -->
        <div class="sidebar-group flex flex-col gap-6">
          <div class="panel side-panel glass">
            <h3 class="section-title">Vessel Authorization</h3>
            <div class="vehicle-display">
              <div class="plate-box">
                <span class="plate-text">{{ res()?.vehiclePlate }}</span>
                <div class="plate-footer">PARKEASE VERIFIED</div>
              </div>
              <div class="vehicle-meta mt-4">
                <div class="meta-item">
                  <span class="lab">Type</span>
                  <span class="val">{{ res()?.vehicleType || 'Standard' }}</span>
                </div>
                <div class="meta-item">
                  <span class="lab">Auth Level</span>
                  <span class="val">Tier 1</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel side-panel glass highlight">
            <h3 class="section-title">Financial Ledger</h3>
            <div class="amount-focus">
              <span class="currency">$</span>
              <span class="val">{{ (res()?.totalAmount || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="ledger-footer mt-4">
              <span class="status" [class.paid]="res()?.status === 'COMPLETED'">
                {{ res()?.status === 'COMPLETED' ? 'Settled' : 'Accruing' }}
              </span>
              <span class="method">Internal Credit</span>
            </div>
          </div>
        </div>
      </div>

      <footer class="details-footer glass">
        <div class="footer-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px; opacity:0.5;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            System modifications are logged for security auditing.
        </div>
        <div class="footer-actions">
           <button class="zenith-btn success" *ngIf="res()?.status === 'RESERVED'" (click)="checkin()">Check In Now</button>
           <button class="zenith-btn primary" *ngIf="res()?.status === 'ACTIVE'" (click)="checkout()">Check Out Now</button>
           <button class="zenith-btn danger" *ngIf="res()?.status === 'RESERVED'" (click)="cancel()">Void Reservation</button>
        </div>
      </footer>
    </div>

    <div class="loader-state" *ngIf="isLoading()">
      <div class="zenith-spinner"></div>
      <p>Synchronizing session data...</p>
    </div>
  `,
  styles: [`
    .zenith-container { padding: 40px; max-width: 1200px; margin: 0 auto; min-height: 100vh; color: var(--text-primary); }
    
    .details-header {
      display: flex; align-items: center; gap: 24px; margin-bottom: 48px;
      .back-btn { 
        width: 48px; height: 48px; border-radius: 16px; border: 1px solid var(--border-color);
        background: var(--bg-card); color: var(--text-primary); cursor: pointer; transition: 0.3s;
        display: flex; align-items: center; justify-content: center;
        svg { width: 20px; height: 20px; }
        &:hover { background: var(--bg-hover); transform: translateX(-4px); border-color: var(--primary-color); }
      }
      .header-main { flex: 1; .id-badge { font-size: 10px; font-weight: 800; color: var(--primary-color); letter-spacing: 2px; } .details-title { font-size: 36px; font-weight: 900; margin: 4px 0 0 0; } }
    }

    .status-pill {
      padding: 8px 20px; border-radius: 100px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
      background: var(--bg-hover); border: 1px solid var(--border-color);
      &[data-status="ACTIVE"] { color: #10b981; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
      &[data-status="RESERVED"] { color: #f59e0b; background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); }
      &[data-status="COMPLETED"] { color: var(--primary-color); background: oklch(var(--primary) / 10%); border-color: oklch(var(--primary) / 20%); }
    }

    .details-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; margin-bottom: 32px; }
    .panel { padding: 40px; border-radius: 32px; border: 1px solid var(--border-color); }
    .section-title { font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 24px; }

    /* Timeline Viz */
    .timeline-viz {
      display: flex; align-items: center; gap: 20px; margin-top: 32px;
      .time-node {
        display: flex; flex-direction: column; min-width: 140px;
        .lab { font-size: 9px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; }
        .val { font-size: 16px; font-weight: 800; margin-top: 4px; }
        .sub { font-size: 13px; color: var(--text-muted); }
        &.end { align-items: flex-end; text-align: right; }
      }
      .time-bridge {
        flex: 1; height: 8px; background: var(--bg-hover); border-radius: 4px; position: relative; overflow: hidden;
        &.active::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: sweep 2s infinite; }
        .bridge-fill { height: 100%; background: var(--primary-color); border-radius: 4px; transition: 1s; }
      }
    }

    .info-card {
      display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--bg-hover); border-radius: 20px; border: 1px solid var(--border-color);
      .icon-box { 
        width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        svg { width: 22px; height: 22px; }
        &.lot { background: oklch(var(--primary) / 10%); color: var(--primary-color); }
        &.spot { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      }
      .card-content { display: flex; flex-direction: column; .val { font-size: 16px; font-weight: 800; } .sub { font-size: 11px; color: var(--text-muted); } }
    }

    /* Vehicle Display */
    .plate-box {
      background: #eee; border-radius: 8px; border: 4px solid #333; padding: 12px 24px; text-align: center; color: #333;
      .plate-text { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 2px; }
      .plate-footer { font-size: 8px; font-weight: 800; opacity: 0.5; border-top: 1px solid rgba(0,0,0,0.1); margin-top: 4px; padding-top: 4px; }
    }
    .vehicle-meta { 
      display: flex; gap: 16px; 
      .meta-item { flex: 1; padding: 16px; background: var(--bg-hover); border-radius: 16px; border: 1px solid var(--border-color); .lab { font-size: 9px; font-weight: 800; color: var(--text-muted); display: block; } .val { font-size: 14px; font-weight: 800; } }
    }

    /* Financials */
    .side-panel.highlight { background: oklch(var(--primary) / 5%); border-color: oklch(var(--primary) / 20%); }
    .amount-focus {
      display: flex; align-items: baseline; gap: 4px;
      .currency { font-size: 24px; font-weight: 800; color: var(--primary-color); }
      .val { font-size: 48px; font-weight: 900; color: var(--text-primary); letter-spacing: -2px; }
    }
    .ledger-footer { 
      display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800; 
      .status.paid { color: #10b981; }
      .method { color: var(--text-muted); }
    }

    .details-footer {
      padding: 24px 40px; border-radius: 24px; border: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center;
      .footer-note { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 10px; }
      .footer-actions { display: flex; gap: 16px; }
    }

    .zenith-btn {
      padding: 12px 28px; border-radius: 16px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.3s;
      &.primary { background: var(--primary-color); color: var(--primary-fg); border: none; &:hover { filter: brightness(1.1); transform: translateY(-2px); } }
      &.success { background: #10b981; color: white; border: none; &:hover { filter: brightness(1.1); transform: translateY(-2px); } }
      &.danger { background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); &:hover { background: #ef4444; color: white; } }
    }

    .loader-state { min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: var(--text-muted); }
    .zenith-spinner { width: 40px; height: 40px; border: 3px solid var(--bg-hover); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
  `]
})
export class ReservationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private resService = inject(ReservationService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  res = signal<Reservation | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadDetails(id);
  }

  loadDetails(id: number) {
    this.isLoading.set(true);
    this.resService.getById(id).subscribe({
      next: (data) => {
        this.res.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Session intelligence synchronization failed.');
        this.router.navigate(['/reservations']);
      }
    });
  }

  progress(): number {
    const r = this.res();
    if (!r) return 0;
    const start = new Date(r.startTime).getTime();
    const end = new Date(r.endTime).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return ((now - start) / (end - start)) * 100;
  }

  checkin() {
    this.resService.checkin(this.res()!.bookingId).subscribe({
      next: () => { this.toast.success('Check-in confirmed.'); this.loadDetails(this.res()!.bookingId); },
      error: (e) => this.toast.error(e.error?.message || 'Check-in failed')
    });
  }

  checkout() {
    this.resService.checkout(this.res()!.bookingId).subscribe({
      next: () => { this.toast.success('Check-out finalized.'); this.loadDetails(this.res()!.bookingId); },
      error: (e) => this.toast.error(e.error?.message || 'Check-out failed')
    });
  }

  cancel() {
    if (!confirm('Void this parking authorization?')) return;
    this.resService.cancel(this.res()!.bookingId).subscribe({
      next: () => { this.toast.success('Authorization voided.'); this.router.navigate(['/reservations']); },
      error: (e) => this.toast.error(e.error?.message || 'Cancellation failed')
    });
  }
}
