import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService, Vehicle } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 42px; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--text-primary);">Fleet Hangar</h2>
        <p style="color: var(--text-muted); margin-top: 8px;">Register and synchronize your vessels for automated network access.</p>
      </div>
      <div class="header-right">
        <div class="view-toggle">
          <button class="toggle-btn" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Grid View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z"/></svg>
          </button>
          <button class="toggle-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')" title="Table View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
        <button class="zenith-btn primary" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Register Vessel
        </button>
      </div>
    </div>
    
    <div class="pe-loader-container" *ngIf="isLoading()">
      <div class="pe-spinner"></div>
      <p>Scanning Hangar...</p>
    </div>

    <div class="page-content animate-in" *ngIf="!isLoading()">
      <!-- Modern Registration Panel -->
      <div class="modern-config-panel glass animate-in" *ngIf="showModal()">
        <div class="panel-header">
          <div class="header-indicator" [class.editing]="editingVehicle"></div>
          <div class="header-text">
            <h3>{{ editingVehicle ? 'Calibrate Vessel Telemetry' : 'Initialize Vessel Registration' }}</h3>
            <p>Sync physical assets with the automated parking network</p>
          </div>
          <button class="close-btn-zenith" (click)="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form (submit)="submitVehicle()" #vForm="ngForm" class="config-form">
          <div class="config-grid">
            <div class="form-field">
              <label>Plate Identifier</label>
              <input type="text" class="zenith-input" name="plate"
                [(ngModel)]="form.licensePlate" required placeholder="MH12AB1234"
                [readonly]="!!editingVehicle">
            </div>
            <div class="form-field">
              <label>Make / Brand</label>
              <input type="text" class="zenith-input" name="make"
                [(ngModel)]="form.make" placeholder="Toyota">
            </div>
            <div class="form-field">
              <label>Vessel Model</label>
              <input type="text" class="zenith-input" name="model"
                [(ngModel)]="form.model" placeholder="Camry">
            </div>
            <div class="form-field">
              <label>Hull Color</label>
              <input type="text" class="zenith-input" name="color"
                [(ngModel)]="form.color" placeholder="Pearl White">
            </div>
          </div>

          <div class="selection-row">
            <div class="selection-group">
              <label>Vessel Class</label>
              <div class="radio-group">
                <label class="radio-pill" *ngFor="let type of ['SEDAN', 'SUV', 'HATCHBACK', 'MOTORCYCLE', 'VAN', 'TRUCK']" [class.active]="form.vehicleType === type">
                  <input type="radio" name="vehicleType" [value]="type" [(ngModel)]="form.vehicleType">
                  {{ type }}
                </label>
              </div>
            </div>

            <div class="selection-group" style="max-width: 200px;">
              <label>Power Core</label>
              <div class="capability-toggles">
                <label class="cap-toggle" [class.active]="form.ev">
                  <input type="checkbox" name="isEv" [(ngModel)]="form.ev">
                  <span class="cap-icon">⚡</span>
                  <span class="cap-text">Electric (EV)</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <button type="submit" class="zenith-btn primary btn-lg" [disabled]="vForm.invalid">
              {{ editingVehicle ? 'Synchronize Vessel' : 'Confirm Registration' }}
            </button>
          </div>
        </form>
      </div>

      <!-- GRID VIEW -->
      <div class="v-grid" *ngIf="viewMode() === 'grid'">
        <div class="v-card glass" *ngFor="let v of vehicles()">
          <div class="v-card-inner">
            <div class="v-card-top">
              <div class="v-symbol">
                <svg *ngIf="v.vehicleType === 'MOTORCYCLE' || v.vehicleType === 'TWO_WHEELER'" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM9 10l.5-2H13l.5 2M8 10h8l-1 5H9l-1-5z" stroke-width="1.5"/></svg>
                <svg *ngIf="v.vehicleType === 'SUV' || v.vehicleType === 'TRUCK' || v.vehicleType === 'VAN'" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 11h20m-2 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16-4l-2-3H6L4 7m16 4h2v3a1 1 0 01-1 1h-1" stroke-width="1.5"/></svg>
                <svg *ngIf="!['MOTORCYCLE', 'TWO_WHEELER', 'SUV', 'TRUCK', 'VAN'].includes(v.vehicleType)" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 17a2 2 0 012-2h10a2 2 0 012 2M5 17h14a2 2 0 012-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-width="1.5"/></svg>
              </div>
              <div class="v-id-box">
                <span class="v-label">IDENTIFIER</span>
                <span class="v-plate">{{ v.licensePlate }}</span>
              </div>
            </div>
            
            <div class="v-specs">
              <div class="spec">
                <span class="s-label">Make / Model</span>
                <span class="s-val">{{ v.make || 'Generic' }} {{ v.model || 'Vessel' }}</span>
              </div>
              <div class="spec-row">
                <div class="mini-spec">
                  <span class="s-label">Type</span>
                  <span class="s-val">{{ v.vehicleType }}</span>
                </div>
                <div class="mini-spec" *ngIf="v.ev">
                  <span class="s-label">Power</span>
                  <span class="s-val ev-tag">ELECTRIC</span>
                </div>
              </div>
            </div>

            <div class="v-card-footer">
              <button class="v-action" (click)="openEditModal(v)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="v-action danger" (click)="deleteVehicle(v.vehicleId)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div class="v-table-wrap" *ngIf="viewMode() === 'table'">
        <table class="pe-table">
          <thead>
            <tr>
              <th>Vessel ID</th>
              <th>Make & Model</th>
              <th>Type</th>
              <th>Power</th>
              <th>Operator</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vehicles()">
              <td class="font-bold">{{ v.licensePlate }}</td>
              <td>{{ v.make || '—' }} {{ v.model || '—' }}</td>
              <td><span class="badge">{{ v.vehicleType }}</span></td>
              <td><span class="ev-text" *ngIf="v.ev">ELECTRIC</span><span *ngIf="!v.ev">COMBUSTION</span></td>
              <td class="text-xs" style="color: var(--primary-color)">USR-{{ v.ownerId }}</td>
              <td>
                <div class="table-actions">
                  <button class="icon-btn" (click)="openEditModal(v)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="icon-btn danger" (click)="deleteVehicle(v.vehicleId)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="vehicles().length === 0" class="empty-state glass p-12">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M7 17a2 2 0 012-2h10a2 2 0 012 2M5 17h14a2 2 0 012-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        <h3>No vessels registered</h3>
        <p>Initialize your first vessel registration to enable network telemetry.</p>
      </div>
    </div>
  `,
  styles: [`
    .modern-config-panel {
      width: 100%; margin-bottom: 32px; padding: 40px; border-radius: 32px;
      background: oklch(var(--bg-card-raw) / 40%); backdrop-filter: blur(40px);
      border: 1px solid oklch(var(--foreground) / 10%);
      box-shadow: none;
      .panel-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;
        .header-indicator { width: 4px; height: 32px; background: #10b981; border-radius: 2px; &.editing { background: var(--primary-color); } }
        .header-text { flex: 1; margin-left: 20px; h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; } p { color: var(--text-muted); font-size: 14px; margin-top: 4px; } }
      }
    }
    .close-btn-zenith { width: 40px; height: 40px; border-radius: 50%; background: oklch(var(--foreground) / 5%); border: none; color: var(--text-muted); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; &:hover { background: oklch(var(--foreground) / 10%); color: var(--text-primary); transform: rotate(90deg); } svg { width: 20px; height: 20px; } }
    .config-form { display: flex; flex-direction: column; gap: 40px; }
    .config-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .form-field { display: flex; flex-direction: column; gap: 10px; label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } }
    .zenith-input { width: 100%; height: 52px; padding: 0 24px; border-radius: 26px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent; color: var(--text-primary); font-family: inherit; font-size: 14px; font-weight: 600; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); &:focus { border-color: var(--primary-color); background: transparent; outline: none; box-shadow: 0 0 0 4px oklch(var(--primary) / 10%); } &::placeholder { color: oklch(var(--foreground) / 30%); } }
    .selection-row { display: flex; gap: 48px; }
    .selection-group { flex: 1; display: flex; flex-direction: column; gap: 16px; label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } }
    .radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .radio-pill { padding: 10px 24px; border-radius: 22px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent; color: var(--text-muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; input { display: none; } &.active { background: var(--primary-color); color: white; border-color: var(--primary-color); box-shadow: 0 4px 15px oklch(var(--primary) / 30%); } &:hover:not(.active) { background: oklch(var(--foreground) / 10%); color: var(--text-primary); } }
    .capability-toggles { display: flex; gap: 12px; }
    .cap-toggle { flex: 1; height: 52px; border-radius: 26px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.3s; input { display: none; } .cap-icon { font-size: 20px; filter: grayscale(1); transition: 0.3s; } .cap-text { font-size: 13px; font-weight: 700; color: var(--text-muted); } &.active { border-color: var(--primary-color); background: oklch(var(--primary) / 10%); .cap-icon { filter: grayscale(0); } .cap-text { color: var(--text-primary); } } &:hover:not(.active) { background: oklch(var(--foreground) / 8%); } }
    .form-footer { display: flex; justify-content: flex-end; padding-top: 24px; border-top: 1px solid oklch(var(--foreground) / 5%); }
    .zenith-btn { padding: 12px 28px; border-radius: 24px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-primary); font-weight: 700; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; svg { width: 18px; height: 18px; } &.primary { background: var(--primary-color); color: var(--primary-fg); border: none; } &:hover { transform: translateY(-2px); background: var(--bg-hover); border-color: var(--primary-color); } &.primary:hover { filter: brightness(1.1); border-color: transparent; } &.btn-lg { height: 52px; padding: 0 40px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; } }
    .header-right { display: flex; align-items: center; gap: 24px; }
    .view-toggle { display: flex; background: oklch(var(--foreground) / 5%); padding: 4px; border-radius: 12px; .toggle-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; svg { width: 18px; height: 18px; } &.active { background: var(--text-primary); color: var(--bg-base); box-shadow: 0 4px 12px oklch(var(--foreground) / 10%); } &:hover:not(.active) { color: var(--text-primary); background: oklch(var(--foreground) / 5%); } } }
    .v-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .v-card { position: relative; border-radius: 32px; overflow: hidden; background: oklch(var(--bg-card-raw) / 40%); backdrop-filter: blur(20px); border: 1px solid oklch(var(--foreground) / 8%); transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); &::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, oklch(var(--primary) / 5%), transparent); opacity: 0; transition: 0.5s; } &:hover { transform: translateY(-8px) scale(1.02); border-color: oklch(var(--primary) / 30%); box-shadow: 0 20px 40px -20px oklch(var(--primary-glow-raw) / 20%); &::before { opacity: 1; } .v-symbol svg { transform: scale(1.1) rotate(-5deg); color: var(--primary-color); } } }
    .v-card-inner { padding: 32px; display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 1; }
    .v-card-top { display: flex; align-items: center; gap: 20px; .v-symbol { width: 60px; height: 60px; border-radius: 18px; background: oklch(var(--foreground) / 5%); display: flex; align-items: center; justify-content: center; color: oklch(var(--foreground) / 60%); transition: 0.5s; svg { width: 32px; height: 32px; transition: 0.5s; } } .v-id-box { display: flex; flex-direction: column; .v-label { font-size: 10px; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; } .v-plate { font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -1px; } } }
    .v-specs { display: flex; flex-direction: column; gap: 16px; .spec { display: flex; flex-direction: column; .s-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } .s-val { font-size: 15px; font-weight: 800; color: var(--text-primary); } } .spec-row { display: flex; gap: 32px; } .mini-spec { display: flex; flex-direction: column; .s-label { font-size: 10px; font-weight: 700; color: var(--text-muted); } .s-val { font-size: 13px; font-weight: 700; color: var(--text-primary); } .ev-tag { color: #10b981; } } }
    .v-card-footer { display: flex; gap: 12px; margin-top: 8px; .v-action { flex: 1; height: 44px; border-radius: 14px; background: oklch(var(--foreground) / 5%); border: 1px solid oklch(var(--foreground) / 10%); color: var(--text-primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.3s; svg { width: 16px; height: 16px; } &:hover { background: var(--bg-hover); border-color: var(--primary-color); color: var(--primary-color); } &.danger { flex: 0 0 44px; &:hover { background: #ef4444; border-color: #ef4444; color: #fff; } } } }
    .pe-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; thead th { padding: 16px; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; text-align: left; } tbody tr { background: oklch(var(--bg-card-raw) / 20%); backdrop-filter: blur(10px); transition: 0.3s; td { padding: 16px; font-size: 14px; border-top: 1px solid oklch(var(--foreground) / 5%); border-bottom: 1px solid oklch(var(--foreground) / 5%); &:first-child { border-left: 1px solid oklch(var(--foreground) / 5%); border-radius: 16px 0 0 16px; } &:last-child { border-right: 1px solid oklch(var(--foreground) / 5%); border-radius: 0 16px 16px 0; } } &:hover { background: oklch(var(--bg-card-raw) / 40%); transform: translateX(4px); } } .badge { font-size: 10px; font-weight: 800; padding: 4px 8px; background: oklch(var(--foreground) / 5%); border-radius: 6px; } .ev-text { color: #10b981; font-weight: 800; font-size: 11px; } .table-actions { display: flex; gap: 8px; } .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid oklch(var(--foreground) / 10%); background: transparent; color: var(--text-muted); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; svg { width: 14px; height: 14px; } &:hover { border-color: var(--primary-color); color: var(--primary-color); } &.danger:hover { background: #ef4444; border-color: #ef4444; color: #fff; } } }
    .pe-loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 20px; color: var(--text-muted); }
    .pe-spinner { width: 40px; height: 40px; border: 3px solid oklch(var(--primary) / 10%); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-box { width: 480px; padding: 44px; border-radius: 32px; border: 1px solid oklch(var(--foreground) / 10%); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; font-weight: 800; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: var(--text-primary); } }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; input { width: 16px; height: 16px; accent-color: var(--primary); } }
  `]
})
export class VehiclesComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }
  get isManagerOrAdmin(): boolean { return this.auth.role === 'ADMIN' || this.auth.role === 'MANAGER'; }
  get currentUserId(): number { return this.auth.currentUser?.userId ?? this.auth.currentUser?.id ?? 0; }

  vehicles = signal<Vehicle[]>([]);
  showModal = signal(false);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'table'>('grid');
  editingVehicle: Vehicle | null = null;

  form: Partial<Vehicle> & { ev: boolean } = this.defaultForm();

  public defaultForm() {
    return { licensePlate: '', vehicleType: 'SEDAN', make: '', model: '', color: '', ev: false };
  }

  ngOnInit() { this.loadVehicles(); }

  loadVehicles() {
    this.isLoading.set(true);
    const request = this.isManagerOrAdmin ? this.vehicleService.getAll() : this.vehicleService.getMyVehicles();
    request.subscribe({
      next: vs => {
        const filtered = this.isManagerOrAdmin ? vs : vs.filter(v => v.ownerId === this.currentUserId);
        this.vehicles.set(filtered);
        this.isLoading.set(false);
      },
      error: () => {
        this.vehicles.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openAddModal() {
    this.editingVehicle = null;
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  openEditModal(v: Vehicle) {
    this.editingVehicle = v;
    this.form = {
      licensePlate: v.licensePlate, vehicleType: v.vehicleType,
      make: v.make, model: v.model, color: v.color, ev: v.ev
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingVehicle = null; }

  submitVehicle() {
    const userId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id;
    if (this.editingVehicle) {
      this.vehicleService.update(this.editingVehicle.vehicleId, this.form).subscribe({
        next: () => { this.toast.success('Vehicle updated!'); this.closeModal(); this.loadVehicles(); },
        error: (e) => this.toast.error(e.error?.message || 'Update failed')
      });
    } else {
      const payload = { ...this.form, ownerId: userId };
      this.vehicleService.create(payload).subscribe({
        next: () => { this.toast.success('Vehicle registered!'); this.closeModal(); this.loadVehicles(); this.form = this.defaultForm(); },
        error: (e) => this.toast.error(e.error?.message || 'Registration failed')
      });
    }
  }

  deleteVehicle(id: number) {
    if (!confirm('Remove this vehicle?')) return;
    this.vehicleService.delete(id).subscribe({
      next: () => { this.toast.success('Vehicle removed'); this.loadVehicles(); },
      error: (e) => this.toast.error(e.error?.message || 'Delete failed')
    });
  }
}
