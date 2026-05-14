import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ParkingLot, ParkingLotService } from '../../core/services/parking-lot.service';
import { ParkingSpot, ParkingSpotService } from '../../core/services/parking-spot.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-parking-spots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Operational Map</h2>
        <p>Live digital twin of physical parking infrastructure</p>
      </div>
      <div class="header-right">
        <div class="sync-status">
          <span class="dot pulse"></span>
          Real-time telemetry active
        </div>
        <button class="btn btn-primary btn-sm" (click)="openAddModal()" *ngIf="selectedLotId !== undefined">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Spot
        </button>
      </div>
    </div>

    <div class="map-layout animate-in">
      <aside class="sidebar-panel glass">
        <div class="panel-section">
          <label>Deployment Zone</label>
          <select class="form-control" [(ngModel)]="selectedLotId" (change)="loadSpots()">
            <option [value]="undefined" disabled>Select a lot</option>
            <option *ngFor="let lot of lots()" [value]="lot.lotId">{{ lot.name }}</option>
          </select>
        </div>

        <div class="panel-section">
          <label>Bay Category</label>
          <div class="tag-grid">
            <button *ngFor="let type of ['ALL', 'COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV']"
                    class="tag-btn" [class.active]="typeFilter === type"
                    (click)="typeFilter = type; filterSpots()">
              {{ type }}
            </button>
          </div>
        </div>

        <div class="panel-section">
          <label>Status Layer</label>
          <div class="status-legend">
            <div class="legend-item" *ngFor="let s of statusOptions"
                 [class.active-filter]="statusFilter === s.val"
                 (click)="statusFilter = s.val; filterSpots()">
              <span class="box" [style.background]="s.color"></span> {{ s.label }}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm w-full mt-4" (click)="statusFilter = 'ALL'; filterSpots()">Clear Filter</button>
        </div>

        <div class="panel-section spot-count">
          <div class="count-item">
            <span class="dot-avail"></span>
            <span>Available: {{ availableCount() }}</span>
          </div>
          <div class="count-item">
            <span class="dot-occ"></span>
            <span>Occupied: {{ occupiedCount() }}</span>
          </div>
          <div class="count-item">
            <span class="dot-res"></span>
            <span>Reserved: {{ reservedCount() }}</span>
          </div>
        </div>
      </aside>

      <main class="map-canvas-container glass">
        <div class="canvas-header">
          <div class="level-info">
            <span class="badge badge-info">All Floors</span>
            <h3>Dynamic Infrastructure Grid</h3>
          </div>
          <span class="text-muted text-sm">{{ filteredSpots().length }} spots shown</span>
        </div>

        <div class="svg-container">
          <svg viewBox="0 0 900 520" class="floor-svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
              </pattern>
              <filter id="neon-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect x="50" y="220" width="800" height="80" rx="10" fill="hsla(222, 47%, 15%, 0.4)" stroke="hsla(var(--p-primary), 0.1)" stroke-width="1" />

            <g *ngFor="let spot of floorSpots; let i = index"
               class="spot-group"
               [class.selected]="selectedSpot?.spotId === spot.spotId"
               [class.available]="spot.status === 'AVAILABLE'"
               [class.occupied]="spot.status === 'OCCUPIED'"
               [class.reserved]="spot.status === 'RESERVED'"
               [class.maintenance]="spot.status === 'MAINTENANCE'"
               (click)="selectSpot(spot)">
              <rect [attr.x]="spotX(i)" [attr.y]="spotY(i)" width="64" height="48" rx="6" class="spot-rect" />
              <text [attr.x]="spotX(i) + 32" [attr.y]="spotY(i) + 22" class="spot-label">{{ spot.spotNumber }}</text>
              <text [attr.x]="spotX(i) + 32" [attr.y]="spotY(i) + 36" class="spot-type">{{ spot.spotType }}</text>
            </g>

            <text x="450" y="270" class="road-label" *ngIf="floorSpots.length === 0">Select a lot to view spots</text>
          </svg>
        </div>
      </main>

      <aside class="detail-panel glass">
        <div class="panel-header">
          <h3>Bay Intel</h3>
          <p>Telemetry Data</p>
        </div>

        <div class="intel-card" *ngIf="selectedSpot; else noSpot">
          <div class="hero-id">
            <span class="label">Spot</span>
            <span class="value">{{ selectedSpot.spotNumber }}</span>
          </div>

          <div class="data-grid">
            <div class="data-item">
              <span class="lbl">Type</span>
              <span class="val">{{ selectedSpot.spotType }}</span>
            </div>
            <div class="data-item">
              <span class="lbl">Vehicle</span>
              <span class="val">{{ selectedSpot.vehicleType }}</span>
            </div>
            <div class="data-item">
              <span class="lbl">Status</span>
              <span class="val" [style.color]="getStatusColor(selectedSpot.status)">{{ selectedSpot.status }}</span>
            </div>
            <div class="data-item">
              <span class="lbl">Rate</span>
              <span class="val">{{ selectedSpot.pricePerHour | currency }}/hr</span>
            </div>
            <div class="data-item">
              <span class="lbl">EV Charging</span>
              <span class="val">{{ selectedSpot.evCharging ? 'Yes' : 'No' }}</span>
            </div>
            <div class="data-item">
              <span class="lbl">Handicap</span>
              <span class="val">{{ selectedSpot.handicapped ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div class="actions mt-6">
            <button class="btn btn-secondary w-full mb-3" (click)="openEditModal(selectedSpot)">
              Edit Spot
            </button>
            <button class="btn btn-ghost w-full btn-danger-text" (click)="deleteSpot(selectedSpot.spotId)">
              Delete Spot
            </button>
          </div>
        </div>

        <ng-template #noSpot>
          <div class="empty-intel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M15 6v12a3 3 0 10-3-3H6a3 3 0 103 3V6a3 3 0 103 3h6a3 3 0 10-3-3z"></path></svg>
            <p>Select a spot on the map to view telemetry.</p>
          </div>
        </ng-template>
      </aside>
    </div>

    <!-- Add/Edit Spot Modal -->
    <div class="overlay" *ngIf="showModal()">
      <div class="card modal-box animate-in">
        <div class="modal-header">
          <h3>{{ editingSpot ? 'Edit Spot' : 'Add Parking Spot' }}</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>
        <form (submit)="submitSpot()" #spotForm="ngForm" class="mt-6">
          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>Spot Number *</label>
              <input type="text" class="form-control" name="spotNumber"
                [(ngModel)]="form.spotNumber" required placeholder="A-101">
            </div>
            <div class="form-group">
              <label>Floor</label>
              <input type="text" class="form-control" name="floor"
                [(ngModel)]="form.floor" placeholder="B1">
            </div>
          </div>
          <div class="form-group mb-4">
            <label>Spot Type *</label>
            <select class="form-control" name="spotType" [(ngModel)]="form.spotType" required>
              <option value="COMPACT">Compact</option>
              <option value="STANDARD">Standard</option>
              <option value="LARGE">Large</option>
              <option value="MOTORBIKE">Motorbike</option>
              <option value="EV">EV</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label>Vehicle Type *</label>
            <select class="form-control" name="vehicleType" [(ngModel)]="form.vehicleType" required>
              <option value="TWO_WHEELER">Two Wheeler</option>
              <option value="FOUR_WHEELER">Four Wheeler</option>
              <option value="HEAVY">Heavy Vehicle</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label>Price Per Hour (₹) *</label>
            <input type="number" class="form-control" name="price"
              [(ngModel)]="form.pricePerHour" required min="0.01" step="0.01">
          </div>
          <div class="flex gap-6 mb-6">
            <label class="toggle-label">
              <input type="checkbox" name="evCharging" [(ngModel)]="form.evCharging">
              <span>EV Charging</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" name="handicapped" [(ngModel)]="form.handicapped">
              <span>Handicap Accessible</span>
            </label>
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="spotForm.invalid">
            {{ editingSpot ? 'Save Changes' : 'Create Spot' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .header-right { display: flex; align-items: center; gap: 16px; }
    .sync-status { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--text-muted); .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; } .pulse { animation: pulse 2s infinite; } }
    .map-layout { display: grid; grid-template-columns: 260px 1fr 280px; gap: 20px; align-items: start; }
    .sidebar-panel, .detail-panel, .map-canvas-container { padding: 20px; border-radius: var(--radius-lg); }
    .panel-section { margin-bottom: 28px; label { display: block; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.1em; } }
    .tag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .tag-btn { background: hsla(255,255%,255%,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 6px 4px; color: var(--text-muted); font-size: 10px; font-weight: 700; cursor: pointer; transition: var(--trans); &.active { background: var(--bg-hover); color: var(--primary); border-color: var(--primary); } }
    .status-legend { display: flex; flex-direction: column; gap: 10px; .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; &:hover, &.active-filter { color: #fff; } .box { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; } } }
    .spot-count { .count-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; } .dot-avail { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; } .dot-occ { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0; } .dot-res { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; } }
    .canvas-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .svg-container { background: hsla(222,47%,5%,0.5); border-radius: 12px; padding: 16px; border: 1px solid var(--border); .floor-svg { width: 100%; height: auto; overflow: visible; } }
    .spot-group { cursor: pointer; .spot-rect { fill: hsla(255,255%,255%,0.05); stroke: hsla(255,255%,255%,0.1); stroke-width: 1.5; transition: var(--trans); } .spot-label { fill: var(--text-secondary); font-size: 9px; font-weight: 800; text-anchor: middle; pointer-events: none; } .spot-type { fill: var(--text-muted); font-size: 7px; text-anchor: middle; pointer-events: none; } &:hover .spot-rect { stroke: var(--primary); stroke-width: 2; } &.selected .spot-rect { fill: var(--bg-hover); stroke: var(--primary); stroke-width: 2.5; filter: url(#neon-glow); } &.available .spot-rect { stroke: #10b981; } &.occupied .spot-rect { stroke: #ef4444; } &.reserved .spot-rect { stroke: #f59e0b; } &.maintenance .spot-rect { stroke: #94a3b8; } }
    .road-label { fill: var(--text-muted); font-size: 16px; text-anchor: middle; }
    .hero-id { margin-bottom: 20px; padding: 16px; background: var(--bg-hover); border-radius: 10px; border: 1px solid var(--border-glow); display: flex; flex-direction: column; .label { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; } .value { font-family: 'Outfit'; font-size: 1.75rem; font-weight: 800; color: #fff; } }
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; .data-item { display: flex; flex-direction: column; .lbl { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; } .val { font-size: 12px; font-weight: 700; color: #fff; } } }
    .empty-intel { padding: 40px 24px; text-align: center; color: var(--text-muted); svg { width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.3; } p { font-size: 12px; line-height: 1.5; } }
    .modal-box { width: 500px; padding: 40px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: #fff; } }
    .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; input { width: 16px; height: 16px; accent-color: var(--primary); } }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
  `]
})
export class ParkingSpotsComponent implements OnInit {
  private spotService = inject(ParkingSpotService);
  private lotService = inject(ParkingLotService);
  private toast = inject(ToastService);

  lots = signal<ParkingLot[]>([]);
  spots = signal<ParkingSpot[]>([]);
  filteredSpots = signal<ParkingSpot[]>([]);
  showModal = signal(false);

  selectedLotId: number | undefined = undefined;
  selectedSpot: ParkingSpot | null = null;
  editingSpot: ParkingSpot | null = null;
  typeFilter = 'ALL';
  statusFilter = 'ALL';

  statusOptions = [
    { val: 'AVAILABLE', label: 'Available', color: '#10b981' },
    { val: 'OCCUPIED', label: 'Occupied', color: '#ef4444' },
    { val: 'RESERVED', label: 'Reserved', color: '#f59e0b' },
    { val: 'MAINTENANCE', label: 'Maintenance', color: '#94a3b8' }
  ];

  form: Partial<ParkingSpot> & { evCharging: boolean; handicapped: boolean } = this.defaultForm();

  private defaultForm() {
    return { spotNumber: '', floor: '', spotType: 'STANDARD', vehicleType: 'FOUR_WHEELER', pricePerHour: 5, evCharging: false, handicapped: false };
  }

  get floorSpots(): ParkingSpot[] { return this.filteredSpots().slice(0, 40); }

  availableCount = signal(0);
  occupiedCount = signal(0);
  reservedCount = signal(0);

  ngOnInit() {
    this.lotService.getAll().subscribe(lots => {
      this.lots.set(lots);
      if (lots.length > 0) { this.selectedLotId = lots[0].lotId; this.loadSpots(); }
    });
  }

  loadSpots() {
    if (this.selectedLotId === undefined) return;
    this.spotService.getByLot(this.selectedLotId).subscribe(spots => {
      this.spots.set(spots);
      this.filterSpots();
      this.availableCount.set(spots.filter(s => s.status === 'AVAILABLE').length);
      this.occupiedCount.set(spots.filter(s => s.status === 'OCCUPIED').length);
      this.reservedCount.set(spots.filter(s => s.status === 'RESERVED').length);
    });
  }

  filterSpots() {
    let filtered = this.spots();
    if (this.typeFilter !== 'ALL') filtered = filtered.filter(s => s.spotType === this.typeFilter);
    if (this.statusFilter !== 'ALL') filtered = filtered.filter(s => s.status === this.statusFilter);
    this.filteredSpots.set(filtered);
    if (!this.selectedSpot || !filtered.find(s => s.spotId === this.selectedSpot?.spotId)) {
      this.selectedSpot = filtered[0] ?? null;
    }
  }

  selectSpot(spot: ParkingSpot) { this.selectedSpot = spot; }

  openAddModal() {
    this.editingSpot = null;
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  openEditModal(spot: ParkingSpot) {
    this.editingSpot = spot;
    this.form = {
      spotNumber: spot.spotNumber, floor: spot.floor,
      spotType: spot.spotType, vehicleType: spot.vehicleType,
      pricePerHour: spot.pricePerHour, evCharging: spot.evCharging, handicapped: spot.handicapped
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingSpot = null; }

  submitSpot() {
    if (this.editingSpot) {
      this.spotService.update(this.editingSpot.spotId, this.form).subscribe({
        next: () => { this.toast.success('Spot updated!'); this.closeModal(); this.loadSpots(); },
        error: (e) => this.toast.error(e.error?.message || 'Update failed')
      });
    } else {
      const payload = { ...this.form, lotId: this.selectedLotId as number };
      this.spotService.create(payload).subscribe({
        next: () => { this.toast.success('Spot created!'); this.closeModal(); this.loadSpots(); },
        error: (e) => this.toast.error(e.error?.message || 'Creation failed')
      });
    }
  }

  deleteSpot(id: number) {
    if (!confirm('Delete this parking spot?')) return;
    this.spotService.delete(id).subscribe({
      next: () => { this.toast.success('Spot deleted'); this.selectedSpot = null; this.loadSpots(); },
      error: (e) => this.toast.error(e.error?.message || 'Delete failed')
    });
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { AVAILABLE: '#10b981', OCCUPIED: '#ef4444', RESERVED: '#f59e0b', MAINTENANCE: '#94a3b8' };
    return map[status] ?? '#94a3b8';
  }

  spotX(index: number): number { return 70 + (index % 10) * 76; }
  spotY(index: number): number {
    const row = Math.floor(index / 10);
    return row < 2 ? 78 + row * 62 : 340 + (row - 2) * 62;
  }
}
