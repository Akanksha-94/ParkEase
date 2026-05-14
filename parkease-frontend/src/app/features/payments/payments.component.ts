import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, Payment, PaymentMode } from '../../core/services/payment.service';
import { ReservationService } from '../../core/services/reservation.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Financial Ledger</h2>
        <p>Monitor your transaction velocity and fiscal history across the network.</p>
      </div>
      <div class="balance-pill">
        <span class="label">Balance Settled</span>
        <span class="dot pulse"></span>
      </div>
    </div>

    <div class="page-content animate-in">
      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="stat-card glass" *ngFor="let s of summary()">
          <div class="label">{{ s.label }}</div>
          <div class="value font-heading">{{ s.value }}</div>
          <div class="accent-bar"></div>
        </div>
      </div>

      <div class="table-container">
        <table class="pe-table">
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Booking</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments()">
              <td><code class="tx-ref">#{{ p.transactionId?.slice(0, 12) || 'TX-' + p.id }}</code></td>
              <td class="text-secondary font-heading">Booking #{{ p.bookingId }}</td>
              <td><span class="font-heading text-primary">{{ p.amount | currency }}</span></td>
              <td>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                  <span class="text-xs font-bold">{{ p.mode || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <span class="badge"
                  [class.badge-success]="p.status === 'COMPLETED'"
                  [class.badge-warning]="p.status === 'PENDING'"
                  [class.badge-danger]="p.status === 'FAILED'"
                  [class.badge-info]="p.status === 'REFUNDED'">
                  {{ p.status }}
                </span>
              </td>
              <td class="text-muted">{{ p.createdAt | date:'MMM d, HH:mm' }}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-primary btn-sm"
                    *ngIf="p.status === 'PENDING'"
                    (click)="openPayModal(p)">
                    Pay Now
                  </button>
                  <button class="btn btn-secondary btn-sm"
                    *ngIf="p.status === 'COMPLETED'"
                    (click)="viewReceipt(p)">
                    Receipt
                  </button>
                  <button class="btn btn-ghost btn-sm btn-danger-text"
                    *ngIf="p.status === 'COMPLETED'"
                    (click)="requestRefund(p)">
                    Refund
                  </button>
                  <button class="btn btn-ghost btn-sm"
                    (click)="viewDetail(p)">
                    Detail
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="payments().length === 0">
              <td colspan="7" class="empty-state p-12">No transaction data available in the current cycle.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pay Now Modal -->
    <div class="overlay" *ngIf="payModal()">
      <div class="card modal-box animate-in">
        <div class="modal-header">
          <h3>Process Payment</h3>
          <button class="close-btn" (click)="payModal.set(null)">✕</button>
        </div>

        <div class="pay-summary glass mt-6 p-4 mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-muted text-sm">Booking</span>
            <span class="font-bold">#{{ payModal()?.bookingId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted text-sm">Amount Due</span>
            <span class="font-heading text-primary text-xl">{{ payModal()?.amount | currency }}</span>
          </div>
        </div>

        <div class="form-group mb-6">
          <label>Payment Mode</label>
          <div class="mode-grid">
            <button *ngFor="let mode of paymentModes"
              class="mode-btn"
              [class.active]="selectedMode === mode.value"
              (click)="selectedMode = mode.value">
              <span class="mode-icon">{{ mode.icon }}</span>
              <span>{{ mode.label }}</span>
            </button>
          </div>
        </div>

        <button class="btn btn-primary w-full btn-lg"
          [disabled]="!selectedMode || paying()"
          (click)="confirmPayment()">
          {{ paying() ? 'Processing...' : 'Confirm Payment' }}
        </button>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div class="overlay" *ngIf="receiptText()">
      <div class="receipt-box glass animate-in">
        <div class="receipt-chrome">
          <div class="logo">PE</div>
          <h3>Payment Receipt</h3>
          <p>AUTHENTICATED TRANSACTION</p>
        </div>
        <div class="receipt-text">
          <pre>{{ receiptText() }}</pre>
        </div>
        <button class="btn btn-primary w-full mt-6" (click)="receiptText.set(null)">Close</button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="overlay" *ngIf="selectedPayment()">
      <div class="receipt-box glass animate-in">
        <div class="receipt-chrome">
          <div class="logo">PE</div>
          <h3>Operational Receipt</h3>
          <p>AUTHENTICATED TRANSACTION</p>
        </div>

        <div class="receipt-content">
          <div class="id-block">
            <label>Reference</label>
            <div class="val">{{ selectedPayment()?.transactionId || 'PENDING' }}</div>
          </div>

          <div class="data-matrix">
            <div class="item">
              <label>Booking ID</label>
              <span>#{{ selectedPayment()?.bookingId }}</span>
            </div>
            <div class="item">
              <label>Payment Mode</label>
              <span>{{ selectedPayment()?.mode || 'N/A' }}</span>
            </div>
            <div class="item">
              <label>Currency</label>
              <span>{{ selectedPayment()?.currency || 'INR' }}</span>
            </div>
            <div class="item">
              <label>Date</label>
              <span>{{ selectedPayment()?.createdAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="total-section">
            <div class="label">Authorized Amount</div>
            <div class="amount font-heading">{{ selectedPayment()?.amount | currency }}</div>
          </div>

          <div class="status-indicator" [class]="selectedPayment()?.status?.toLowerCase()">
            {{ selectedPayment()?.status }}
          </div>
        </div>

        <button class="btn btn-primary w-full mt-8" (click)="selectedPayment.set(null)">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .balance-pill { display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: hsla(142, 71%, 45%, 0.1); border: 1px solid hsla(142, 71%, 45%, 0.2); border-radius: 12px; color: #10b981; font-size: 13px; font-weight: 800; .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; } }

    .stat-card {
      padding: 24px; position: relative; overflow: hidden;
      .label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
      .value { font-size: 2rem; color: #fff; }
      .accent-bar { position: absolute; bottom: 0; left: 0; width: 40px; height: 4px; background: var(--primary); border-radius: 0 4px 4px 0; }
    }

    .tx-ref { font-family: 'Inter'; font-size: 12px; color: var(--primary); font-weight: 700; background: hsla(var(--p-primary), 0.1); padding: 4px 8px; border-radius: 6px; }
    .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } }

    .modal-box { width: 480px; padding: 40px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: #fff; } }

    .pay-summary { border-radius: 12px; }

    .mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
    .mode-btn {
      background: hsla(255, 255%, 255%, 0.03); border: 1px solid var(--border); border-radius: 12px;
      padding: 16px 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;
      cursor: pointer; transition: var(--trans); color: var(--text-secondary); font-size: 13px; font-weight: 700;
      .mode-icon { font-size: 24px; }
      &:hover { border-color: var(--primary); color: var(--primary); }
      &.active { background: hsla(var(--p-primary), 0.1); border-color: var(--primary); color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
    }

    .receipt-box {
      width: 440px; padding: 48px; border-radius: 24px; text-align: center; border: 1px solid var(--border-glow);
      .receipt-chrome { margin-bottom: 32px; .logo { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; font-weight: 900; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 8px 20px var(--primary-glow); } h3 { font-size: 1.5rem; } p { font-size: 10px; font-weight: 900; color: var(--accent); letter-spacing: 0.2em; } }
    }

    .receipt-text { background: var(--bg-hover); padding: 20px; border-radius: 12px; text-align: left; pre { font-size: 12px; color: var(--text-secondary); white-space: pre-wrap; word-break: break-all; } }

    .id-block { background: hsla(255, 255%, 255%, 0.03); padding: 16px; border-radius: 12px; margin-bottom: 24px; label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } .val { font-size: 14px; font-weight: 700; color: #fff; margin-top: 4px; } }

    .data-matrix { text-align: left; display: grid; gap: 14px; margin-bottom: 24px; .item { display: flex; justify-content: space-between; align-items: baseline; label { font-size: 11px; font-weight: 700; color: var(--text-muted); } span { font-size: 13px; font-weight: 700; color: #fff; } } }

    .total-section { padding-top: 20px; border-top: 1px dashed var(--border); margin-bottom: 24px; .label { font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; } .amount { font-size: 2.5rem; color: #fff; } }

    .status-indicator { padding: 12px; border-radius: 10px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; &.completed { background: hsla(142, 71%, 45%, 0.1); color: #10b981; } &.pending { background: hsla(38, 92%, 50%, 0.1); color: #f59e0b; } &.failed { background: hsla(0, 84%, 60%, 0.1); color: #ef4444; } &.refunded { background: hsla(var(--p-primary), 0.1); color: var(--primary); } }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `]
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private resService = inject(ReservationService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  payments = signal<Payment[]>([]);
  selectedPayment = signal<Payment | null>(null);
  payModal = signal<Payment | null>(null);
  receiptText = signal<string | null>(null);
  paying = signal(false);
  selectedMode: PaymentMode | null = null;

  paymentModes = [
    { value: 'CARD' as PaymentMode, label: 'Card', icon: '💳' },
    { value: 'UPI' as PaymentMode, label: 'UPI', icon: '📱' },
    { value: 'WALLET' as PaymentMode, label: 'Wallet', icon: '👛' },
    { value: 'CASH' as PaymentMode, label: 'Cash', icon: '💵' }
  ];

  summary = signal([
    { label: 'Fiscal Velocity', value: '$0.00' },
    { label: 'Successful Cycles', value: '0' },
    { label: 'Pending Uplinks', value: '0' }
  ]);

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.paymentService.getMyPayments().subscribe({
      next: ps => {
        this.payments.set(ps);
        const total = ps.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + p.amount, 0);
        const completed = ps.filter(p => p.status === 'COMPLETED').length;
        const pending = ps.filter(p => p.status === 'PENDING').length;
        this.summary.set([
          { label: 'Fiscal Velocity', value: '$' + total.toFixed(2) },
          { label: 'Successful Cycles', value: completed.toString() },
          { label: 'Pending Uplinks', value: pending.toString() }
        ]);
      },
      error: () => this.payments.set([])
    });
  }

  viewDetail(p: Payment) {
    this.selectedPayment.set(p);
  }

  openPayModal(p: Payment) {
    this.selectedMode = null;
    this.payModal.set(p);
  }

  confirmPayment() {
    const p = this.payModal();
    if (!p || !this.selectedMode) return;
    const userId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id ?? 0;

    this.paying.set(true);
    this.paymentService.processPayment({
      bookingId: p.bookingId,
      userId: userId as number,
      lotId: p.lotId ?? 0,
      amount: p.amount,
      mode: this.selectedMode,
      currency: 'INR',
      description: `Payment for Booking #${p.bookingId}`
    }).subscribe({
      next: () => {
        this.toast.success('Payment processed successfully!');
        this.payModal.set(null);
        this.paying.set(false);
        this.loadPayments();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Payment failed. Please try again.');
        this.paying.set(false);
      }
    });
  }

  viewReceipt(p: Payment) {
    this.paymentService.getReceipt(p.id).subscribe({
      next: (text) => this.receiptText.set(text),
      error: () => this.toast.error('Failed to fetch receipt')
    });
  }

  requestRefund(p: Payment) {
    if (!confirm('Are you sure you want to request a refund for this payment?')) return;
    this.paymentService.refundPayment(p.id, 'Customer requested refund').subscribe({
      next: () => {
        this.toast.success('Refund requested successfully');
        this.loadPayments();
      },
      error: (err) => this.toast.error(err.error?.message || 'Refund request failed')
    });
  }
}
