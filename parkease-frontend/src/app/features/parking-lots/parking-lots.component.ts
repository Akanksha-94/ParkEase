import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-parking-lots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Parking Networks</h2>
        <p>Manage and monitor your physical parking assets</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Provision New Lot
      </button>
    </div>

    <div class="page-content animate-in">
      <div class="filter-bar glass mb-8 p-4">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
          <input type="text" placeholder="Search by name or city..." [(ngModel)]="searchQuery" (input)="filterLots()">
        </div>
        <select class="glass-select" [(ngModel)]="statusFilter" (change)="filterLots()">
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div class="grid grid-auto">
        <div class="lot-card" *ngFor="let lot of filteredLots()">
          <div class="visual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10"></path>
            </svg>
            <span class="badge" [class.badge-success]="lot.isOpen" [class.badge-danger]="!lot.isOpen">
              {{ lot.isOpen ? 'ONLINE' : 'OFFLINE' }}
            </span>
            <span class="badge badge-info approved-badge" *ngIf="!lot.isApproved">PENDING</span>
          </div>
          <div class="body">
            <div class="title-row">
              <h3>{{ lot.name }}</h3>
              <span class="rate font-heading">{{ lot.hourlyRate | currency }}/hr</span>
            </div>
            <p class="meta">{{ lot.address }}, {{ lot.city }}</p>

            <div class="usage-stats">
              <div class="label-row">
                <span>Utilization</span>
                <span>{{ lot.totalSpots - lot.availableSpots }} / {{ lot.totalSpots }}</span>
              </div>
              <div class="progress-track">
                <div class="fill" [style.width.%]="lot.totalSpots > 0 ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100 : 0"></div>
              </div>
            </div>

            <div class="footer">
              <button class="btn btn-secondary btn-sm" (click)="toggleOpen(lot)">
                {{ lot.isOpen ? 'Close' : 'Open' }}
              </button>
              <button class="btn btn-ghost btn-sm" (click)="openEditModal(lot)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-danger-text" *ngIf="!lot.isApproved" (click)="approveLot(lot.lotId)">
                Approve
              </button>
              <button class="btn btn-ghost btn-sm btn-danger-text" (click)="deleteLot(lot.lotId)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="filteredLots().length === 0" class="empty-state glass">
        <h3>No lots found</h3>
        <p>Refine your search or provision a new parking infrastructure.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="overlay" *ngIf="showModal()">
      <div class="card modal-box animate-in">
        <div class="modal-header">
          <h3>{{ editingLot ? 'Edit Lot' : 'Provision Infrastructure' }}</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>
        <form (submit)="submitLot()" #lotForm="ngForm" class="mt-6">
          <div class="form-group mb-4">
            <label>Lot Name *</label>
            <input type="text" class="form-control" name="name" [(ngModel)]="form.name" required>
          </div>
          <div class="form-group mb-4">
            <label>Address *</label>
            <input type="text" class="form-control" name="address" [(ngModel)]="form.address" placeholder="123 Main Street" required>
          </div>
          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>City *</label>
              <input type="text" class="form-control" name="city" [(ngModel)]="form.city" required>
            </div>
            <div class="form-group">
              <label>State</label>
              <input type="text" class="form-control" name="state" [(ngModel)]="form.state" placeholder="MH">
            </div>
          </div>
          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>ZIP Code</label>
              <input type="text" class="form-control" name="zipCode" [(ngModel)]="form.zipCode" placeholder="400001">
            </div>
            <div class="form-group">
              <label>Hourly Rate (₹/hr) *</label>
              <input type="number" class="form-control" name="hourlyRate" [(ngModel)]="form.hourlyRate" required min="1">
            </div>
          </div>
          <div class="form-group mb-4" *ngIf="!editingLot">
            <label>Total Spots *</label>
            <input type="number" class="form-control" name="totalSpots" [(ngModel)]="form.totalSpots" required min="1">
          </div>
          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>Latitude *</label>
              <input type="number" class="form-control" name="lat" [(ngModel)]="form.latitude" placeholder="18.9220" required step="any">
            </div>
            <div class="form-group">
              <label>Longitude *</label>
              <input type="number" class="form-control" name="lng" [(ngModel)]="form.longitude" placeholder="72.8347" required step="any">
            </div>
          </div>
          <p class="text-muted text-xs mb-6">💡 Tip: Find coordinates at <strong>maps.google.com</strong> → right-click → "What's here?"</p>
          <button type="submit" class="btn btn-primary w-full" [disabled]="lotForm.invalid">
            {{ editingLot ? 'Save Changes' : 'Create Lot' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex; gap: 16px; align-items: center;
      .search-input { position: relative; flex: 1; max-width: 400px;
        svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); }
        input { width: 100%; padding: 12px 16px 12px 48px; background: hsla(255,255%,255%,0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-family: inherit; font-size: 14px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); } }
      }
    }

    .lot-card {
      background: hsla(222, 47%, 10%, 0.4); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-lg); transition: var(--trans); padding: 0; overflow: hidden;
      &:hover { border-color: hsla(var(--p-primary), 0.3); transform: translateY(-2px); }
      .visual { height: 100px; background: hsla(222, 47%, 15%, 0.5); display: flex; align-items: center; justify-content: center; position: relative; color: var(--primary); svg { width: 48px; height: 48px; } .badge { position: absolute; top: 12px; right: 12px; } .approved-badge { top: 12px; left: 12px; } }
      .body { padding: 20px; }
      .title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; h3 { font-size: 1.1rem; } .rate { font-size: 13px; color: var(--primary); } }
      .meta { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }
      .usage-stats { margin-bottom: 16px; .label-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; } .progress-track { height: 5px; background: hsla(255,255%,255%,0.05); border-radius: 10px; overflow: hidden; .fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: inherit; } } }
      .footer { display: flex; gap: 8px; flex-wrap: wrap; .btn-ghost { padding: 0 8px; svg { width: 16px; height: 16px; } } }
    }

    .modal-box { width: 540px; padding: 40px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: #fff; } }
    .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } svg { width: 16px; height: 16px; } }
  `]
})
export class ParkingLotsComponent implements OnInit {
  private lotService = inject(ParkingLotService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  lots = signal<ParkingLot[]>([]);
  filteredLots = signal<ParkingLot[]>([]);
  showModal = signal(false);
  editingLot: ParkingLot | null = null;

  searchQuery = '';
  statusFilter = 'ALL';

  form: any = this.defaultForm();

  private defaultForm() {
    return { name: '', address: '', city: '', state: '', zipCode: '', totalSpots: 50, hourlyRate: 5, latitude: undefined as number | undefined, longitude: undefined as number | undefined };
  }

  ngOnInit() { this.loadLots(); }

  loadLots() {
    const user = this.auth.currentUser;
    const params: any = {};
    
    // If manager, only show their lots (including unapproved)
    // If admin, show everything
    // If driver, the backend currently defaults to approved only, but we could add a flag
    if (user?.role === 'MANAGER') {
      params.managerId = user.userId || user.id;
    }

    this.lotService.getAll(params).subscribe({ 
      next: lots => { 
        this.lots.set(lots); 
        this.filterLots(); 
      }, 
      error: (e) => {
        this.toast.error('Failed to synchronize parking network telemetry.');
      } 
    });
  }

  filterLots() {
    let filtered = this.lots();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
    }
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(l => this.statusFilter === 'OPEN' ? l.isOpen : !l.isOpen);
    }
    this.filteredLots.set(filtered);
  }

  openCreateModal() {
    this.editingLot = null;
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  openEditModal(lot: ParkingLot) {
    this.editingLot = lot;
    this.form = {
      name: lot.name,
      address: lot.address,
      city: lot.city,
      hourlyRate: lot.hourlyRate,
      latitude: lot.latitude,
      longitude: lot.longitude
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingLot = null; }

  submitLot() {
    const userId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id;

    if (this.editingLot) {
      const updatePayload = {
        name: this.form.name,
        address: this.form.address,
        city: this.form.city,
        hourlyRate: Number(this.form.hourlyRate),
        latitude: Number(this.form.latitude),
        longitude: Number(this.form.longitude)
      };
      this.lotService.update(this.editingLot.lotId, updatePayload).subscribe({
        next: () => { this.toast.success('Lot updated!'); this.closeModal(); this.loadLots(); },
        error: (e) => {
          console.error('Update error:', e);
          const msg = e.error?.message || e.message || 'Update failed';
          this.toast.error(msg);
        }
      });
    } else {
      const createPayload = {
        name: this.form.name,
        address: this.form.address,
        city: this.form.city,
        totalSpots: Number(this.form.totalSpots),
        hourlyRate: Number(this.form.hourlyRate),
        latitude: Number(this.form.latitude),
        longitude: Number(this.form.longitude),
        managerId: Number(userId)
      };
      console.log('Creating lot with payload:', createPayload);
      this.lotService.create(createPayload).subscribe({
        next: () => { this.toast.success('Parking lot created!'); this.closeModal(); this.loadLots(); },
        error: (e) => {
          console.error('Create lot error full:', e);
          const msg = e.error?.message || e.message || 'Creation failed';
          this.toast.error(msg);
        }
      });
    }
  }

  toggleOpen(lot: ParkingLot) {
    this.lotService.toggleOpen(lot.lotId).subscribe({
      next: () => { this.toast.success(`Lot ${lot.isOpen ? 'closed' : 'opened'}`); this.loadLots(); },
      error: () => this.toast.error('Toggle failed')
    });
  }

  approveLot(id: number) {
    this.lotService.approve(id).subscribe({
      next: () => { this.toast.success('Lot approved!'); this.loadLots(); },
      error: (e) => this.toast.error(e.error?.message || 'Approval failed')
    });
  }

  deleteLot(id: number) {
    if (!confirm('Delete this parking lot?')) return;
    this.lotService.delete(id).subscribe({
      next: () => { this.toast.success('Lot deleted'); this.loadLots(); },
      error: (e) => this.toast.error(e.error?.message || 'Delete failed')
    });
  }
}
