import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, Reservation } from '../../core/services/reservation.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';
import { ParkingSpotService, ParkingSpot } from '../../core/services/parking-spot.service';
import { VehicleService, Vehicle } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Booking Ledger</h2>
        <p>Orchestrate and monitor active parking session lifecycles</p>
      </div>
      <button class="btn btn-primary" (click)="openBookingModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        New Session
      </button>
    </div>

    <div class="page-content animate-in">
      <div class="table-container">
        <table class="pe-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Lot / Spot</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let res of reservations()">
              <td class="font-heading">#{{ res.bookingId || 'N/A' }}</td>
              <td>
                <div class="flex flex-col">
                  <span class="text-secondary text-sm">{{ res.lotName || 'Lot #' + res.lotId }}</span>
                  <span class="badge badge-info mt-1" style="width:fit-content">{{ res.spotNumber || 'Spot' }}</span>
                </div>
              </td>
              <td class="font-heading text-sm">{{ res.vehiclePlate || 'N/A' }}</td>
              <td>
                <span class="badge"
                  [class.badge-success]="res.status === 'RESERVED' || res.status === 'ACTIVE'"
                  [class.badge-danger]="res.status === 'CANCELLED'"
                  [class.badge-info]="res.status === 'COMPLETED'">
                  {{ res.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-2 flex-wrap">
                   <button class="btn btn-secondary btn-sm"
                    *ngIf="res.status === 'RESERVED'" (click)="checkin(res.bookingId)">
                    Check In
                  </button>
                  <button class="btn btn-primary btn-sm"
                    *ngIf="res.status === 'ACTIVE'" (click)="checkout(res.bookingId)">
                    Check Out
                  </button>
                  <button class="btn btn-ghost btn-sm"
                    *ngIf="res.status === 'RESERVED' || res.status === 'ACTIVE'"
                    (click)="openExtendModal(res)">
                    Extend
                  </button>
                  <button class="btn btn-ghost btn-sm btn-danger-text"
                    *ngIf="res.status === 'RESERVED'"
                    (click)="cancel(res.bookingId)">
                    Cancel
                  </button>
                </div>
              </td>
              <td class="text-muted text-sm">{{ res.startTime | date:'MMM d, h:mm a' }}</td>
              <td class="text-muted text-sm">{{ res.endTime | date:'MMM d, h:mm a' }}</td>
              <td class="font-heading">
                <div class="flex items-center gap-3">
                  <span class="font-heading">{{ res.totalAmount | currency }}</span>
                  <button class="btn btn-secondary btn-xs" *ngIf="res.totalAmount === undefined || res.totalAmount === null" (click)="fetchAmount(res)">
                    Get Amount
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="reservations().length === 0">
              <td colspan="8" class="empty-state p-12">No active parking sessions found in the ledger.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Booking Modal -->
    <div class="overlay" *ngIf="showModal()">
      <div class="card modal-box animate-in">
        <div class="modal-header">
          <h3>Session Configuration</h3>
          <button class="close-btn" (click)="showModal.set(false)">✕</button>
        </div>

        <form (ngSubmit)="createBooking()" #bookForm="ngForm" class="mt-8">
          <div class="form-group mb-6">
            <label>Infrastructure Zone *</label>
            <select class="form-control" name="lotId" [(ngModel)]="newRes.lotId" (change)="onLotChange()" required>
              <option [value]="null" disabled>Select parking lot</option>
              <option *ngFor="let lot of lots()" [value]="lot.lotId">{{ lot.name }} — {{ lot.city }}</option>
            </select>
          </div>

          <div class="form-group mb-6" *ngIf="newRes.lotId">
            <label>Available Bays *</label>
            <div class="spot-selector glass p-4" *ngIf="availableSpots().length > 0">
              <div *ngFor="let spot of availableSpots()"
                   class="spot-option"
                   [class.active]="newRes.spotId === spot.spotId"
                   (click)="newRes.spotId = spot.spotId">
                {{ spot.spotNumber }}
                <span class="spot-type-tag">{{ spot.spotType }}</span>
              </div>
            </div>
            <div *ngIf="availableSpots().length === 0" class="text-danger mt-2 text-xs font-bold">
              No available bays in this zone.
            </div>
          </div>

          <div class="form-group mb-6">
            <label>Vessel Authorization *</label>
            <select class="form-control" name="vehicleId" [(ngModel)]="newRes.vehicleId" required>
              <option [value]="null" disabled>Select vehicle</option>
              <option *ngFor="let v of vehicles()" [value]="v.vehicleId">
                {{ v.licensePlate }} ({{ v.vehicleType }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="form-group">
              <label>Start Time *</label>
              <input type="datetime-local" class="form-control" name="start" [(ngModel)]="newRes.startTime" required>
            </div>
            <div class="form-group">
              <label>End Time *</label>
              <input type="datetime-local" class="form-control" name="end" [(ngModel)]="newRes.endTime" required>
            </div>
          </div>

          <div class="form-group mb-8">
            <label>Booking Type</label>
            <select class="form-control" name="bookingType" [(ngModel)]="bookingType">
              <option value="PRE">Pre-Booked</option>
              <option value="WALK_IN">Walk-In</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full"
            [disabled]="bookForm.invalid || !newRes.spotId || submitting()">
            {{ submitting() ? 'Processing...' : 'Finalize Authorization' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Extend Booking Modal -->
    <div class="overlay" *ngIf="extendModal()">
      <div class="card modal-box-sm animate-in">
        <div class="modal-header">
          <h3>Extend Booking</h3>
          <button class="close-btn" (click)="extendModal.set(null)">✕</button>
        </div>
        <p class="text-muted text-sm mt-4 mb-6">Booking #{{ extendModal()?.bookingId }} — Current end: {{ extendModal()?.endTime | date:'MMM d, h:mm a' }}</p>
        <div class="form-group mb-6">
          <label>New End Time *</label>
          <input type="datetime-local" class="form-control" [(ngModel)]="newEndTime" name="newEnd">
        </div>
        <button class="btn btn-primary w-full" [disabled]="!newEndTime || extending()"
          (click)="confirmExtend()">
          {{ extending() ? 'Extending...' : 'Confirm Extension' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-box { width: 540px; padding: 48px; max-height: 90vh; overflow-y: auto; }
    .modal-box-sm { width: 420px; padding: 40px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: #fff; } }

    .spot-selector {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 180px; overflow-y: auto;
      .spot-option {
        background: hsla(255,255%,255%,0.03); border: 1px solid var(--border); border-radius: 8px;
        padding: 10px 6px; font-size: 11px; font-weight: 800; text-align: center; cursor: pointer; transition: var(--trans);
        &:hover { border-color: var(--primary); }
        &.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
        .spot-type-tag { display: block; font-size: 9px; font-weight: 600; color: inherit; opacity: 0.7; margin-top: 2px; }
      }
    }

    .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .p-12 { padding: 48px; }
    .mt-1 { margin-top: 4px; }
  `]
})
export class ReservationsComponent implements OnInit {
  private resService = inject(ReservationService);
  private lotService = inject(ParkingLotService);
  private spotService = inject(ParkingSpotService);
  private vehicleService = inject(VehicleService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  reservations = signal<Reservation[]>([]);
  lots = signal<ParkingLot[]>([]);
  availableSpots = signal<ParkingSpot[]>([]);
  vehicles = signal<Vehicle[]>([]);
  showModal = signal(false);
  extendModal = signal<Reservation | null>(null);
  submitting = signal(false);
  extending = signal(false);

  newRes: Partial<Reservation> = { lotId: undefined, spotId: undefined, vehicleId: undefined, startTime: '', endTime: '' };
  bookingType = 'PRE';
  newEndTime = '';

  ngOnInit() { this.loadReservations(); }

  loadReservations() {
    const role = this.auth.role;
    const request = role === 'ADMIN' ? this.resService.getAll() : this.resService.getMyReservations();
    
    request.subscribe({
      next: res => this.reservations.set(res?.filter(r => !!r && !!r.bookingId) || []),
      error: () => this.reservations.set([])
    });
  }

  openBookingModal(type: string = 'PRE') {
    console.log('Opening booking modal for type:', type);
    this.lotService.getAll().subscribe({
      next: lots => this.lots.set(lots),
      error: () => this.toast.error('Failed to load parking zones')
    });
    this.vehicleService.getMyVehicles().subscribe({
      next: vs => this.vehicles.set(vs),
      error: () => this.toast.error('Failed to load your fleet')
    });
    this.newRes = { lotId: undefined, spotId: undefined, vehicleId: undefined, startTime: '', endTime: '' };
    this.bookingType = type === 'DAILY' ? 'PRE' : 'PRE'; // Default to PRE as per backend enum
    this.showModal.set(true);
  }

  onLotChange() {
    if (!this.newRes.lotId) return;
    this.spotService.getAvailable(Number(this.newRes.lotId)).subscribe({
      next: spots => { this.availableSpots.set(spots); this.newRes.spotId = undefined; },
      error: () => this.availableSpots.set([])
    });
  }

  createBooking() {
    console.log('Finalizing authorization with data:', this.newRes);
    const selectedVehicle = this.vehicles().find(v => v.vehicleId == this.newRes.vehicleId);
    if (!selectedVehicle) {
      this.toast.error('Please select a valid vehicle');
      return;
    }
    const payload = {
      ...this.newRes,
      userId: this.auth.currentUser?.userId ?? this.auth.currentUser?.id,
      vehiclePlate: selectedVehicle?.licensePlate,
      vehicleType: selectedVehicle?.vehicleType,
      bookingType: this.bookingType
    };
    console.log('Sending booking payload:', payload);
    this.submitting.set(true);
    this.resService.create(payload).subscribe({
      next: () => {
        this.toast.success('Reservation confirmed!');
        this.showModal.set(false);
        this.submitting.set(false);
        this.loadReservations();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Authorization failed. Please verify your inputs.');
        this.submitting.set(false);
      }
    });
  }

  cancel(id: number) {
    if (!confirm('Cancel this reservation?')) return;
    this.resService.cancel(id).subscribe({
      next: () => { this.toast.success('Reservation cancelled'); this.loadReservations(); },
      error: (e) => this.toast.error(e.error?.message || 'Cancellation failed')
    });
  }

  checkin(id: number) {
    this.resService.checkin(id).subscribe({
      next: () => { this.toast.success('Check-in successful!'); this.loadReservations(); },
      error: (e) => this.toast.error(e.error?.message || 'Check-in failed')
    });
  }

  checkout(id: number) {
    this.resService.checkout(id).subscribe({
      next: () => { this.toast.success('Check-out successful!'); this.loadReservations(); },
      error: (e) => this.toast.error(e.error?.message || 'Check-out failed')
    });
  }

  openExtendModal(res: Reservation) {
    this.newEndTime = '';
    this.extendModal.set(res);
  }

  confirmExtend() {
    const res = this.extendModal();
    if (!res || !this.newEndTime) return;
    this.extending.set(true);
    this.resService.extend(res.bookingId, this.newEndTime).subscribe({
      next: () => {
        this.toast.success('Booking extended successfully!');
        this.extendModal.set(null);
        this.extending.set(false);
        this.loadReservations();
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Extension failed');
        this.extending.set(false);
      }
    });
  }

  fetchAmount(res: Reservation) {
    this.resService.getAmount(res.bookingId).subscribe({
      next: (amount) => {
        const updated = this.reservations().map(r => r.bookingId === res.bookingId ? { ...r, totalAmount: amount } : r);
        this.reservations.set(updated);
      },
      error: () => this.toast.error('Could not fetch amount')
    });
  }
}
