import { Component, inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, Reservation } from '../../core/services/reservation.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';
import { ParkingSpotService, ParkingSpot } from '../../core/services/parking-spot.service';
import { VehicleService, Vehicle } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import flatpickr from 'flatpickr';


@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 42px; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--text-primary);">Booking Ledger</h2>
        <p style="color: var(--text-muted); margin-top: 8px;">Orchestrate and monitor active parking session lifecycles.</p>
      </div>
      <button class="zenith-btn primary" (click)="toggleModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        New Reservation
      </button>
    </div>

    <!-- Modern Configuration Interface -->
    <div class="modern-config-panel glass animate-in" *ngIf="showModal()">
      <div class="panel-header">
        <div class="header-indicator" [class.editing]="editingId()"></div>
        <div class="header-text">
          <h3>{{ editingId() ? 'Update Authorization' : 'Initialize New Session' }}</h3>
          <p>Precision control for parking network synchronization</p>
        </div>
        <button class="close-btn-zenith" (click)="toggleModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="config-grid">
        <div class="form-field">
          <label>Infrastructure Zone</label>
          <div class="custom-dropdown" (click)="$event.stopPropagation(); showLotDrop.set(!showLotDrop())">
            <div class="selected-value" [class.placeholder]="!newRes.lotId">
              {{ getLotName(newRes.lotId) || 'Select Zone...' }}
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
            </div>
            <div class="dropdown-list glass" *ngIf="showLotDrop()">
              <div class="dropdown-item" *ngFor="let lot of lots()" (click)="selectLot(lot)">
                <div class="item-icon">Z</div>
                <div class="item-info">
                  <span class="item-name">{{ lot.name }}</span>
                  <span class="item-meta">{{ lot.address }}</span>
                </div>
              </div>
              <div class="dropdown-empty text-center text-muted text-sm py-4" *ngIf="lots().length === 0">
                No zones available
              </div>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label>Vessel Authorization</label>
          <div class="custom-dropdown" (click)="$event.stopPropagation(); showVehDrop.set(!showVehDrop())">
            <div class="selected-value" [class.placeholder]="!newRes.vehicleId">
              {{ getVehiclePlate(newRes.vehicleId) || 'Select Vessel...' }}
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
            </div>
            <div class="dropdown-list glass" *ngIf="showVehDrop()">
              <div class="dropdown-item" *ngFor="let v of vehicles()" (click)="selectVehicle(v)">
                <div class="item-icon">V</div>
                <div class="item-info">
                  <span class="item-name">{{ v.licensePlate }}</span>
                  <span class="item-meta">{{ v.vehicleType }}</span>
                </div>
              </div>
              <div class="dropdown-empty text-center text-muted text-sm py-4" *ngIf="vehicles().length === 0">
                No vessels registered
              </div>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label>Arrival Sequence</label>
          <div class="input-with-icon">
            <input type="text" class="zenith-input date-trigger" #startPicker placeholder="Select timestamp..." [(ngModel)]="newRes.startTime">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>

        <div class="form-field">
          <label>Departure Sequence</label>
          <div class="input-with-icon">
            <input type="text" class="zenith-input date-trigger" #endPicker placeholder="Select timestamp..." [(ngModel)]="newRes.endTime">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
      </div>

      <div class="config-actions">
        <div class="strategy-selector">
          <span class="label">Booking Strategy</span>
          <div class="radio-group">
            <label class="radio-pill" [class.active]="bookingType === 'PRE'" (click)="bookingType = 'PRE'">
              PRE-BOOKED
            </label>
            <label class="radio-pill" [class.active]="bookingType === 'WALK_IN'" (click)="bookingType = 'WALK_IN'">
              WALK-IN
            </label>
          </div>
        </div>

        <div class="bay-control" *ngIf="newRes.lotId">
          <span class="label">Target Bay: <strong class="highlight">{{ selectedSpotNumber() || 'UNASSIGNED' }}</strong></span>
          <div class="spot-grid-mini">
            <div class="spot-chip" *ngFor="let s of availableSpots()" 
                 [class.active]="newRes.spotId === s.spotId"
                 (click)="newRes.spotId = s.spotId">
              {{ s.spotNumber }}
            </div>
          </div>
        </div>

        <button class="zenith-btn primary btn-lg" [disabled]="!canSubmit() || submitting()" (click)="createBooking()">
          {{ submitting() ? 'SYNCHRONIZING...' : (editingId() ? 'UPDATE SESSION' : 'CONFIRM RESERVATION') }}
        </button>
      </div>
    </div>

    <div class="page-content animate-in" *ngIf="!isLoading()">
      <div class="ledger-container">
        <table class="zenith-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Deployment Zone</th>
              <th>Vessel</th>
              <th *ngIf="isAdmin">Pilot</th>
              <th>Lifecycle</th>
              <th class="actions-th">Controls</th>
              <th>Timeline</th>
              <th>Telemetry</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let res of reservations()" class="ledger-row" (click)="viewDetails(res.bookingId)">
              <td class="id-cell">#{{ res.bookingId }}</td>
              <td>
                <div class="zone-info">
                  <span class="zone-name">{{ res.lotName || 'Sector ' + res.lotId }}</span>
                  <span class="bay-tag">BAY-{{ res.spotNumber }}</span>
                </div>
              </td>
              <td class="vessel-cell">{{ res.vehiclePlate }}</td>
              <td *ngIf="isAdmin" class="pilot-cell">USR-{{ res.userId }}</td>
              <td>
                <div class="lifecycle-badge" [attr.data-status]="res.status">
                  <span class="pulse-dot"></span>
                  {{ res.status }}
                </div>
              </td>
              <td (click)="$event.stopPropagation()">
                <div class="row-controls">
                  <button class="ctrl-btn-success" *ngIf="res.status === 'RESERVED'" (click)="checkin(res.bookingId)">IN</button>
                  <button class="ctrl-btn-primary" *ngIf="res.status === 'ACTIVE'" (click)="checkout(res.bookingId)">OUT</button>
                  <button class="ctrl-btn-zenith" *ngIf="res.status !== 'COMPLETED'" (click)="openEditModal(res)">EDIT</button>
                  <button class="ctrl-btn-danger" (click)="deleteReservation(res.bookingId)">DEL</button>
                </div>
              </td>
              <td class="time-cell">
                <div class="timeline-stack">
                  <span>{{ res.startTime | date:'MMM d, HH:mm' }}</span>
                  <span class="divider">↓</span>
                  <span>{{ res.endTime | date:'MMM d, HH:mm' }}</span>
                </div>
              </td>
              <td class="amount-cell">
                <div class="amount-wrapper" *ngIf="res.totalAmount !== null">
                  {{ res.totalAmount | currency }}
                </div>
                <button class="zenith-btn primary btn-xs" *ngIf="res.totalAmount === null" (click)="$event.stopPropagation(); fetchAmount(res)">
                  SYNC
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
        <button class="zenith-btn primary w-full" [disabled]="!newEndTime || extending()"
          (click)="confirmExtend()">
          {{ extending() ? 'Extending...' : 'Confirm Extension' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .ledger-title { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin: 0; color: var(--text-primary); }
    .ledger-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }
      .modern-config-panel {
      margin-bottom: 3rem; padding: 40px; border-radius: 40px; 
      background: oklch(var(--bg-card-raw) / 60%); backdrop-filter: blur(40px);
      border: 1px solid oklch(var(--primary) / 15%);
      box-shadow: none;
    }

    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .header-indicator { width: 12px; height: 12px; border-radius: 50%; background: #10b981; box-shadow: 0 0 12px #10b981; &.editing { background: #f59e0b; box-shadow: 0 0 12px #f59e0b; } }
    .header-text { flex: 1; margin-left: 20px; h3 { margin: 0; font-size: 24px; font-weight: 900; color: var(--text-primary); } p { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } }
    .close-btn-zenith { width: 44px; height: 44px; border-radius: 50%; background: oklch(var(--foreground) / 5%); border: none; color: var(--text-muted); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; &:hover { background: oklch(var(--foreground) / 10%); color: var(--text-primary); transform: rotate(90deg); } svg { width: 20px; height: 20px; } }

    .config-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
    .form-field { display: flex; flex-direction: column; gap: 10px; label { font-size: 11px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; } }

    .custom-dropdown {
      position: relative; height: 54px; border-radius: 27px; background: oklch(var(--foreground) / 5%);
      border: 1px solid transparent; cursor: pointer; transition: 0.3s;
      &:hover { background: oklch(var(--foreground) / 8%); border-color: oklch(var(--primary) / 30%); }
      .selected-value { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; font-weight: 800; font-size: 13px; color: var(--text-primary); }
      .placeholder { color: var(--text-muted); }
      .chevron { width: 16px; height: 16px; transition: 0.3s; color: var(--text-muted); }
      .dropdown-list {
        position: absolute; top: 64px; left: 0; right: 0; z-index: 100; padding: 12px;
        border-radius: 24px; max-height: 300px; overflow-y: auto; background: var(--bg-base);
        border: 1px solid oklch(var(--foreground) / 15%);
        box-shadow: 0 20px 40px oklch(var(--foreground) / 20%);
        animation: dropIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .dropdown-item {
        display: flex; align-items: center; gap: 16px; padding: 14px 18px; border-radius: 16px; transition: 0.2s;
        &:hover { background: oklch(var(--primary) / 10%); color: var(--primary-color); }
        .item-icon { width: 36px; height: 36px; border-radius: 12px; background: oklch(var(--foreground) / 5%); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; }
        .item-info { display: flex; flex-direction: column; }
        .item-name { font-weight: 800; font-size: 14px; }
        .item-meta { font-size: 11px; opacity: 0.6; }
      }
    }

    @keyframes dropIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .zenith-input {
      width: 100%; height: 54px; padding: 0 24px; border-radius: 27px; background: oklch(var(--foreground) / 5%);
      border: 1px solid transparent; color: var(--text-primary); font-weight: 800; outline: none; transition: 0.3s;
      font-size: 13px;
      &:focus { border-color: var(--primary-color); background: transparent; box-shadow: 0 0 0 4px oklch(var(--primary) / 10%); }
    }

    .input-with-icon { position: relative; .input-icon { position: absolute; right: 24px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--primary-color); pointer-events: none; opacity: 0.6; } }

    .config-actions { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 40px; padding-top: 40px; border-top: 1px solid oklch(var(--foreground) / 5%); }
    .label { display: block; font-size: 11px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    
    .radio-group { display: flex; gap: 12px; }
    .radio-pill {
      padding: 12px 24px; border-radius: 22px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent;
      cursor: pointer; font-weight: 800; font-size: 11px; transition: 0.3s; color: var(--text-muted);
      &.active { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 10px 20px oklch(var(--primary) / 30%); }
      &:hover:not(.active) { background: oklch(var(--foreground) / 10%); color: var(--text-primary); }
    }

    .spot-grid-mini { display: flex; gap: 10px; flex-wrap: wrap; }
    .spot-chip {
      width: 40px; height: 40px; border-radius: 12px; border: 1px solid oklch(var(--foreground) / 10%);
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; cursor: pointer; transition: 0.2s;
      background: oklch(var(--foreground) / 3%); color: var(--text-muted);
      &:hover { border-color: var(--primary-color); color: var(--primary-color); }
      &.active { background: var(--primary-color); color: white; border-color: var(--primary-color); box-shadow: 0 8px 16px oklch(var(--primary) / 30%); }
    }

    .ledger-container { border-radius: 32px; overflow: hidden; background: oklch(var(--bg-card-raw) / 40%); backdrop-filter: blur(20px); border: 1px solid oklch(var(--foreground) / 8%); }
    .zenith-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .zenith-table th { padding: 24px; text-align: left; font-size: 11px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; background: oklch(var(--foreground) / 5%); }
    .ledger-row { 
      border-bottom: 1px solid oklch(var(--foreground) / 5%); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; 
      &:hover { background: oklch(var(--foreground) / 4%); transform: scale(1.002); } 
      td { padding: 24px; border-bottom: 1px solid oklch(var(--foreground) / 5%); }
    }
    .id-cell { font-weight: 900; color: var(--primary-color); font-size: 14px; }
    .zone-info { display: flex; flex-direction: column; gap: 6px; }
    .zone-name { font-weight: 800; font-size: 15px; color: var(--text-primary); }
    .bay-tag { font-size: 10px; font-weight: 900; color: var(--primary-color); background: oklch(var(--primary) / 10%); padding: 3px 10px; border-radius: 6px; width: fit-content; }
    .vessel-cell { font-weight: 900; font-family: 'Space Mono', monospace; font-size: 14px; color: var(--text-primary); }
    
    .lifecycle-badge {
      display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase;
      padding: 8px 16px; border-radius: 100px; width: fit-content; letter-spacing: 0.5px;
      &[data-status="ACTIVE"] { color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); .pulse-dot { background: #10b981; animation: pulse 1.5s infinite; } }
      &[data-status="RESERVED"] { color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); .pulse-dot { background: #f59e0b; } }
      &[data-status="COMPLETED"] { color: var(--text-muted); background: oklch(var(--foreground) / 8%); .pulse-dot { background: var(--text-muted); } }
    }

    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; }

    .row-controls { display: flex; gap: 10px; }
    .ctrl-btn-success { width: 44px; height: 36px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; &:hover { background: #10b981; color: white; } }
    .ctrl-btn-primary { width: 44px; height: 36px; border-radius: 10px; background: oklch(var(--primary) / 10%); border: 1px solid oklch(var(--primary) / 20%); color: var(--primary-color); font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; &:hover { background: var(--primary-color); color: white; } }
    .ctrl-btn-zenith { width: 44px; height: 36px; border-radius: 10px; background: oklch(var(--foreground) / 5%); border: 1px solid oklch(var(--foreground) / 10%); color: var(--text-primary); font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; &:hover { background: var(--text-primary); color: var(--background); } }
    .ctrl-btn-danger { width: 44px; height: 36px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.3s; &:hover { background: #ef4444; color: white; } }

    .timeline-stack { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 700; color: var(--text-muted); .divider { color: var(--primary-color); opacity: 0.4; font-weight: 900; margin-left: 20px; } }
    .amount-cell { font-size: 16px; font-weight: 900; color: var(--text-primary); }
    .fetch-btn { @extend .zenith-btn !optional; @extend .primary !optional; padding: 4px 12px; font-size: 10px; height: 28px; }
    .zenith-btn.btn-xs { height: 28px; padding: 0 12px; font-size: 10px; }
    .zenith-btn.btn-lg { height: 54px; padding: 0 40px; font-size: 15px; letter-spacing: 2px; }
  `]
})
export class ReservationsComponent implements OnInit, AfterViewInit {
  private resService = inject(ReservationService);
  private lotService = inject(ParkingLotService);
  private spotService = inject(ParkingSpotService);
  private vehicleService = inject(VehicleService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  @ViewChild('startPicker') startPicker!: ElementRef;
  @ViewChild('endPicker') endPicker!: ElementRef;

  showLotDrop = signal(false);
  showVehDrop = signal(false);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }

  ngOnInit() { 
    this.loadReservations();
    document.addEventListener('click', () => {
      this.showLotDrop.set(false);
      this.showVehDrop.set(false);
    });
  }

  ngAfterViewInit() {
    this.initPickers();
  }

  private initPickers() {
    if (this.startPicker) {
      const fp = flatpickr(this.startPicker.nativeElement, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: this.newRes.startTime,
        onChange: (dates, str) => this.newRes.startTime = str
      });
    }
    if (this.endPicker) {
      const fp = flatpickr(this.endPicker.nativeElement, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: this.newRes.endTime,
        onChange: (dates, str) => this.newRes.endTime = str
      });
    }
  }

  toggleModal() {
    this.showModal.set(!this.showModal());
    if (this.showModal()) {
      setTimeout(() => this.initPickers(), 100);
      this.loadMeta();
    }
  }

  loadMeta() {
    this.lotService.getAll().subscribe(lots => this.lots.set(lots));
    this.vehicleService.getMyVehicles().subscribe(vs => this.vehicles.set(vs));
  }

  getLotName(id?: number) { return this.lots().find(l => l.lotId == id)?.name; }
  getVehiclePlate(id?: number) { return this.vehicles().find(v => v.vehicleId == id)?.licensePlate; }

  selectLot(lot: ParkingLot) {
    this.newRes.lotId = lot.lotId;
    this.onLotChange();
    this.showLotDrop.set(false);
  }

  selectVehicle(v: Vehicle) {
    this.newRes.vehicleId = v.vehicleId;
    this.showVehDrop.set(false);
  }

  canSubmit() {
    return this.newRes.lotId && this.newRes.spotId && this.newRes.vehicleId && this.newRes.startTime && this.newRes.endTime;
  }

  selectedSpotNumber(): string | undefined {
    return this.availableSpots().find(s => s.spotId === this.newRes.spotId)?.spotNumber;
  }

  viewDetails(id: number) {
    this.router.navigate(['/reservations', id]);
  }

  reservations = signal<Reservation[]>([]);
  lots = signal<ParkingLot[]>([]);
  availableSpots = signal<ParkingSpot[]>([]);
  vehicles = signal<Vehicle[]>([]);
  showModal = signal(false);
  extendModal = signal<Reservation | null>(null);
  submitting = signal(false);
  extending = signal(false);
  isLoading = signal(true);
  editingId = signal<number | null>(null);

  newRes: Partial<Reservation> = { lotId: undefined, spotId: undefined, vehicleId: undefined, startTime: '', endTime: '' };
  bookingType = 'PRE';
  newEndTime = '';

  loadReservations() {
    this.isLoading.set(true);
    const role = this.auth.role;
    const request = role === 'ADMIN' ? this.resService.getAll() : this.resService.getMyReservations();

    request.subscribe({
      next: res => {
        this.reservations.set(res?.filter(r => !!r && !!r.bookingId) || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openEditModal(res: Reservation) {
    this.editingId.set(res.bookingId);
    this.loadMeta();
    this.newRes = { 
      lotId: res.lotId, 
      spotId: res.spotId, 
      vehicleId: res.vehicleId, 
      startTime: res.startTime, 
      endTime: res.endTime 
    };
    this.onLotChange();
    this.showModal.set(true);
    setTimeout(() => this.initPickers(), 100);
  }

  onLotChange() {
    if (!this.newRes.lotId) return;
    this.spotService.getAvailable(Number(this.newRes.lotId)).subscribe({
      next: spots => { this.availableSpots.set(spots); this.newRes.spotId = undefined; },
      error: () => this.availableSpots.set([])
    });
  }

  createBooking() {
    const selectedVehicle = this.vehicles().find(v => v.vehicleId == this.newRes.vehicleId);
    if (!selectedVehicle) return;
    
    const payload = {
      ...this.newRes,
      userId: this.auth.currentUser?.userId ?? this.auth.currentUser?.id,
      vehiclePlate: selectedVehicle?.licensePlate,
      vehicleType: selectedVehicle?.vehicleType,
      bookingType: this.bookingType
    };
    
    this.submitting.set(true);
    const request = this.editingId() 
      ? this.resService.update(this.editingId()!, payload)
      : this.resService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Synchronization successful');
        this.showModal.set(false);
        this.submitting.set(false);
        this.loadReservations();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Authorization failed');
        this.submitting.set(false);
      }
    });
  }

  deleteReservation(id: number) {
    if (!confirm('Delete record?')) return;
    this.resService.delete(id).subscribe(() => {
      this.toast.success('Record purged');
      this.loadReservations();
    });
  }

  cancel(id: number) {
    this.resService.cancel(id).subscribe(() => this.loadReservations());
  }

  checkin(id: number) {
    this.resService.checkin(id).subscribe(() => this.loadReservations());
  }

  checkout(id: number) {
    this.resService.checkout(id).subscribe(() => this.loadReservations());
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
        this.toast.success('Temporal window extended');
        this.extendModal.set(null);
        this.extending.set(false);
        this.loadReservations();
      },
      error: () => this.extending.set(false)
    });
  }

  fetchAmount(res: Reservation) {
    this.resService.getAmount(res.bookingId).subscribe(amount => {
      const updated = this.reservations().map(r => r.bookingId === res.bookingId ? { ...r, totalAmount: amount } : r);
      this.reservations.set(updated);
    });
  }
}
