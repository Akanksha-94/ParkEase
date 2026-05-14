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
    <div class="page-header animate-in">
      <div>
        <h2>Fleet Hangar</h2>
        <p>Register and synchronize your vessels for automated network access.</p>
      </div>
      <button class="btn btn-primary" (click)="openAddModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Register Vessel
      </button>
    </div>

    <div class="page-content animate-in">
      <div class="grid grid-auto gap-6">
        <div class="vehicle-card glass" *ngFor="let v of vehicles()">
          <div class="card-visual">
            <div class="silhouette-box">
              <svg *ngIf="v.vehicleType === 'MOTORCYCLE' || v.vehicleType === 'TWO_WHEELER'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 17a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM9 10l.5-2H13l.5 2M8 10h8l-1 5H9l-1-5z"></path></svg>
              <svg *ngIf="v.vehicleType !== 'MOTORCYCLE' && v.vehicleType !== 'TWO_WHEELER'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17a2 2 0 012-2h10a2 2 0 012 2M5 17h14a2 2 0 012-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <span class="badge badge-info">{{ v.vehicleType }}</span>
          </div>

          <div class="card-intel">
            <div class="plate-row">
              <span class="label">Authorization ID</span>
              <h3>{{ v.licensePlate }}</h3>
            </div>

            <div class="spec-grid">
              <div class="spec-item">
                <span class="lbl">Make</span>
                <span class="val">{{ v.make || '—' }}</span>
              </div>
              <div class="spec-item">
                <span class="lbl">Model</span>
                <span class="val">{{ v.model || '—' }}</span>
              </div>
              <div class="spec-item">
                <span class="lbl">Color</span>
                <span class="val">{{ v.color || '—' }}</span>
              </div>
              <div class="spec-item">
                <span class="lbl">EV</span>
                <span class="val">{{ v.ev ? 'Yes' : 'No' }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn btn-ghost btn-sm" (click)="openEditModal(v)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
              <button class="btn btn-ghost btn-sm btn-danger-text" (click)="deleteVehicle(v.vehicleId)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="vehicles().length === 0" class="empty-state glass p-12">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M7 17a2 2 0 012-2h10a2 2 0 012 2M5 17h14a2 2 0 012-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        <h3>No vessels registered</h3>
        <p>Initialize your first vessel registration to enable network telemetry.</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="overlay" *ngIf="showModal()">
      <div class="card modal-box animate-in">
        <div class="modal-header">
          <h3>{{ editingVehicle ? 'Edit Vessel' : 'Vessel Registration' }}</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <form (submit)="submitVehicle()" #vForm="ngForm" class="mt-8">
          <div class="form-group mb-6">
            <label>License Plate *</label>
            <input type="text" class="form-control" name="plate"
              [(ngModel)]="form.licensePlate" required placeholder="MH12AB1234"
              [readonly]="!!editingVehicle">
          </div>

          <div class="form-group mb-6">
            <label>Vehicle Type *</label>
            <select class="form-control" name="type" [(ngModel)]="form.vehicleType" required>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="VAN">Van</option>
              <option value="TRUCK">Truck</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="form-group">
              <label>Make / Brand</label>
              <input type="text" class="form-control" name="make"
                [(ngModel)]="form.make" placeholder="Toyota">
            </div>
            <div class="form-group">
              <label>Model</label>
              <input type="text" class="form-control" name="model"
                [(ngModel)]="form.model" placeholder="Camry">
            </div>
          </div>

          <div class="form-group mb-4">
            <label>Color</label>
            <input type="text" class="form-control" name="color"
              [(ngModel)]="form.color" placeholder="Pearl White">
          </div>

          <div class="flex gap-6 mb-8">
            <label class="toggle-label">
              <input type="checkbox" name="isEv" [(ngModel)]="form.ev">
              <span>Electric Vehicle (EV)</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="vForm.invalid">
            {{ editingVehicle ? 'Save Changes' : 'Register Vehicle' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .vehicle-card {
      display: flex; gap: 20px; padding: 20px; transition: var(--trans);
      &:hover { border-color: var(--primary); transform: translateY(-3px); }
    }

    .card-visual {
      width: 90px; display: flex; flex-direction: column; gap: 12px; align-items: center; flex-shrink: 0;
      .silhouette-box { width: 88px; height: 88px; border-radius: 14px; background: hsla(255,255%,255%,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--primary); svg { width: 44px; height: 44px; } }
    }

    .card-intel {
      flex: 1; display: flex; flex-direction: column;
      .plate-row { margin-bottom: 16px; .label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 2px; } h3 { font-size: 1.4rem; } }
    }

    .spec-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid var(--border);
      .spec-item { display: flex; flex-direction: column; .lbl { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; } .val { font-size: 13px; font-weight: 700; color: #fff; } }
    }

    .card-actions { display: flex; gap: 8px; margin-top: auto; .btn-ghost { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; svg { width: 14px; height: 14px; } } .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } } }

    .modal-box { width: 480px; padding: 44px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: #fff; } }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; input { width: 16px; height: 16px; accent-color: var(--primary); } }
  `]
})
export class VehiclesComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  vehicles = signal<Vehicle[]>([]);
  showModal = signal(false);
  editingVehicle: Vehicle | null = null;

  form: Partial<Vehicle> & { ev: boolean } = this.defaultForm();

  private defaultForm() {
    return { licensePlate: '', vehicleType: 'SEDAN', make: '', model: '', color: '', ev: false };
  }

  ngOnInit() { this.loadVehicles(); }

  loadVehicles() {
    const role = this.auth.role;
    const request = role === 'ADMIN' ? this.vehicleService.getAll() : this.vehicleService.getMyVehicles();
    
    request.subscribe({
      next: vs => this.vehicles.set(vs),
      error: () => this.vehicles.set([])
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
