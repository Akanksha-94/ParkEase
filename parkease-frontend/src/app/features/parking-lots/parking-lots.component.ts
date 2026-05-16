import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
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
    <div class="page-header animate-in" style="margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 42px; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--text-primary);">Parking Networks</h2>
        <p style="color: var(--text-muted); margin-top: 8px;">Manage and monitor your physical parking assets</p>
      </div>
    </div>

    <div class="page-content animate-in">
      <div class="modern-config-panel glass animate-in" *ngIf="showModal()">
        <div class="panel-header">
          <div class="header-indicator" [class.editing]="editingLot"></div>
          <div class="header-text">
            <h3>{{ editingLot ? 'Calibrate Zone Topology' : 'Provision New Infrastructure Zone' }}</h3>
            <p>Deploy advanced parking telemetry and management systems</p>
          </div>
          <button class="close-btn-zenith" (click)="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form (submit)="submitLot()" #lotForm="ngForm" class="config-form">
          <div class="config-grid">
            <div class="form-field span-2">
              <label>Zone Designation</label>
              <input type="text" class="zenith-input" name="name" [(ngModel)]="form.name" required placeholder="e.g., Central Plaza North">
            </div>
            <div class="form-field span-2">
              <label>Physical Address</label>
              <input type="text" class="zenith-input" name="address" [(ngModel)]="form.address" required placeholder="123 Alpha Street">
            </div>
            <div class="form-field">
              <label>City Hub</label>
              <input type="text" class="zenith-input" name="city" [(ngModel)]="form.city" required placeholder="Mumbai">
            </div>
            <div class="form-field">
              <label>State/Region</label>
              <input type="text" class="zenith-input" name="state" [(ngModel)]="form.state" placeholder="MH">
            </div>
            <div class="form-field">
              <label>Postal Code</label>
              <input type="text" class="zenith-input" name="zipCode" [(ngModel)]="form.zipCode" placeholder="400001">
            </div>
            <div class="form-field">
              <label>Fiscal Rate (₹/hr)</label>
              <input type="number" class="zenith-input" name="hourlyRate" [(ngModel)]="form.hourlyRate" required min="1">
            </div>
            <div class="form-field" *ngIf="!editingLot">
              <label>Capacity (Bays)</label>
              <input type="number" class="zenith-input" name="totalSpots" [(ngModel)]="form.totalSpots" required min="1">
            </div>
            <div class="form-field">
              <label>Latitude Vector</label>
              <input type="number" class="zenith-input" name="lat" [(ngModel)]="form.latitude" placeholder="18.9220" required step="any">
            </div>
            <div class="form-field">
              <label>Longitude Vector</label>
              <input type="number" class="zenith-input" name="lng" [(ngModel)]="form.longitude" placeholder="72.8347" required step="any">
            </div>
          </div>
          <div class="form-footer">
            <p class="tip-text">💡 Tip: Right-click on Google Maps for precise coordinates</p>
            <button type="submit" class="zenith-btn primary btn-lg" [disabled]="lotForm.invalid">
              {{ editingLot ? 'Synchronize Topology' : 'Confirm Provisioning' }}
            </button>
          </div>
        </form>
      </div>

      <div class="flex justify-between items-center mb-8">
        <div class="filter-group">
          <div class="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
            <input type="text" placeholder="Search by name or city..." [(ngModel)]="searchQuery" (input)="filterLots()">
          </div>
          <div class="custom-dropdown" [class.open]="dropdownOpen()">
            <div class="dropdown-selected" (click)="toggleDropdown($event)">
              <span>{{ statusFilter === 'ALL' ? 'All Status' : statusFilter === 'OPEN' ? 'Open' : 'Closed' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="dropdown-menu" *ngIf="dropdownOpen()">
              <div class="dropdown-item" [class.active]="statusFilter === 'ALL'" (click)="setStatusFilter('ALL', $event)">All Status</div>
              <div class="dropdown-item" [class.active]="statusFilter === 'OPEN'" (click)="setStatusFilter('OPEN', $event)">Open</div>
              <div class="dropdown-item" [class.active]="statusFilter === 'CLOSED'" (click)="setStatusFilter('CLOSED', $event)">Closed</div>
            </div>
          </div>
          <div class="view-toggles">
            <button class="view-btn" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button class="view-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <button class="zenith-btn primary" (click)="openCreateModal()" *ngIf="isAdmin || isManager">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Provision New Lot
        </button>
      </div>

      <div class="grid grid-auto" *ngIf="viewMode() === 'grid'">
        <div class="lot-card" *ngFor="let lot of filteredLots()">
          <div class="body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span class="pending-badge" *ngIf="!lot.isApproved">PENDING</span>
              <span class="status-badge" [class.online]="lot.isOpen">
                {{ lot.isOpen ? 'ONLINE' : 'OFFLINE' }}
              </span>
            </div>
            <div class="title-row">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: oklch(var(--primary) / 10%); border-radius: 10px; color: var(--primary-color);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10"></path></svg>
                </div>
                <h3>{{ lot.name }}</h3>
              </div>
              <span class="rate">{{ lot.hourlyRate | currency }}/hr</span>
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
            <div class="footer" *ngIf="isAdmin || isManager">
              <button class="action-btn" (click)="toggleOpen(lot)">{{ lot.isOpen ? 'Go Offline' : 'Go Online' }}</button>
              <button class="icon-btn" (click)="openEditModal(lot)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
              <button class="icon-btn success" *ngIf="!lot.isApproved && isAdmin" (click)="approveLot(lot.lotId)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></button>
              <button class="icon-btn danger" (click)="deleteLot(lot.lotId)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container animate-in" *ngIf="viewMode() === 'table'">
        <table class="pe-table">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Location Hub</th>
              <th>Fiscal Rate</th>
              <th>Utilization Status</th>
              <th *ngIf="isAdmin || isManager">Command Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lot of filteredLots()">
              <td class="font-heading"><div class="flex items-center gap-3"><span class="status-dot" [class.online]="lot.isOpen"></span>{{ lot.name }}</div></td>
              <td>{{ lot.city }}, {{ lot.state }}</td>
              <td class="font-heading" style="color: var(--primary-color); font-weight: 800;">{{ lot.hourlyRate | currency }}</td>
              <td>
                <div class="text-sm font-heading">{{ lot.totalSpots - lot.availableSpots }} / {{ lot.totalSpots }}</div>
                <div style="width: 100px; height: 4px; background: var(--border-color); border-radius: 4px; overflow: hidden; margin-top: 4px;">
                  <div [style.width.%]="lot.totalSpots > 0 ? (lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100 : 0" style="height: 100%; background: var(--primary-color);"></div>
                </div>
              </td>
              <td *ngIf="isAdmin || isManager">
                <div class="flex gap-2">
                  <button class="action-btn" (click)="toggleOpen(lot)">{{ lot.isOpen ? 'Close' : 'Open' }}</button>
                  <button class="action-btn" (click)="openEditModal(lot)">Edit</button>
                  <button class="action-btn success" *ngIf="!lot.isApproved && isAdmin" (click)="approveLot(lot.lotId)">Approve</button>
                  <button class="action-btn danger" (click)="deleteLot(lot.lotId)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="filteredLots().length === 0" class="empty-state glass">
        <h3>No lots found</h3>
        <p>Refine your search or provision a new parking infrastructure.</p>
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
    .config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 32px; }
    .form-field { display: flex; flex-direction: column; gap: 8px; &.span-2 { grid-column: span 2; } label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; padding-left: 16px; } }
    .zenith-input { background: oklch(var(--foreground) / 5%); border: 1px solid transparent; border-radius: 26px; padding: 14px 24px; color: var(--text-primary); font-size: 15px; font-weight: 600; transition: 0.3s; &:focus { border-color: var(--primary-color); background: oklch(var(--foreground) / 8%); outline: none; } &::placeholder { color: var(--text-muted); opacity: 0.5; } }
    .form-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid oklch(var(--foreground) / 8%); .tip-text { font-size: 12px; color: var(--text-muted); font-weight: 500; } }
    .lot-card {
      background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: 24px; transition: var(--trans); padding: 0; overflow: hidden; display: flex; flex-direction: column;
      &:hover { border-color: var(--primary-color); transform: translateY(-4px); box-shadow: 0 8px 30px oklch(var(--foreground) / 10%); }
      .body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
      .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; } .rate { font-size: 14px; font-weight: 800; color: var(--primary-color); } }
      .meta { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.4; padding-left: 48px; }
      .usage-stats { margin-bottom: 24px; margin-top: auto; .label-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; } .progress-track { height: 6px; background: var(--border-color); border-radius: 10px; overflow: hidden; .fill { height: 100%; background: var(--primary-color); border-radius: inherit; filter: drop-shadow(0 0 5px var(--primary-glow)); transition: width 1s ease-out; } } }
      .footer { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; align-items: center; .action-btn { flex: 1; border-radius: 9999px; background: var(--bg-hover); border: 1px solid var(--border-color); color: var(--text-primary); font-weight: 700; padding: 10px 16px; cursor: pointer; transition: 0.3s; &:hover { background: var(--primary-color); color: var(--primary-fg); border-color: transparent; } } .icon-btn { width: 40px; height: 40px; padding: 0; background: transparent; border: 1px solid var(--border-color); border-radius: 50%; color: var(--text-muted); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { color: var(--text-primary); border-color: var(--primary-color); background: oklch(var(--primary) / 10%); } svg { width: 18px; height: 18px; } } }
    }
    .action-btn { padding: 6px 12px; border-radius: 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: 0.3s; background: var(--bg-hover); border: 1px solid transparent; color: var(--text-primary); }
    .action-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .action-btn.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .action-btn.success:hover { background: #10b981; color: #fff; }
    .action-btn.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
    .action-btn.danger:hover { background: #ef4444; color: #fff; }
    .status-badge, .pending-badge { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; line-height: 1; }
    .status-badge { background: oklch(var(--foreground) / 10%); color: var(--text-muted); border: 1px solid transparent; }
    .status-badge.online { background: oklch(var(--primary) / 15%); color: var(--primary-color); border: 1px solid oklch(var(--primary) / 30%); }
    .pending-badge { background: oklch(var(--foreground) / 10%); color: var(--text-primary); border: 1px solid var(--border-color); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); opacity: 0.5; &.online { background: #10b981; opacity: 1; box-shadow: 0 0 8px #10b981; } }
    .search-input { position: relative; flex: 1; min-width: 300px; svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); } input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 16px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent; color: var(--text-primary); font-size: 14px; transition: 0.3s; &:focus { border-color: var(--primary-color); background: oklch(var(--foreground) / 8%); outline: none; } } }
    .filter-group { display: flex; align-items: center; gap: 16px; flex: 1; }
    .view-toggles { display: flex; background: oklch(var(--foreground) / 5%); padding: 4px; border-radius: 12px; .view-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; transition: 0.3s; &.active { background: var(--bg-card); color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.1); } svg { width: 18px; height: 18px; } } }
  `]
})
export class ParkingLotsComponent implements OnInit {
  private lotService = inject(ParkingLotService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }
  get isManager(): boolean { return this.auth.role === 'MANAGER'; }

  lots = signal<ParkingLot[]>([]);
  filteredLots = signal<ParkingLot[]>([]);
  showModal = signal(false);
  dropdownOpen = signal(false);
  viewMode = signal<'grid' | 'table'>('grid');
  editingLot: ParkingLot | null = null;

  searchQuery = '';
  statusFilter = 'ALL';

  form: any = this.defaultForm();

  public defaultForm() {
    return { name: '', address: '', city: '', state: '', zipCode: '', totalSpots: 50, hourlyRate: 5, latitude: undefined as number | undefined, longitude: undefined as number | undefined };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  setStatusFilter(val: string, event: Event) {
    event.stopPropagation();
    this.statusFilter = val;
    this.dropdownOpen.set(false);
    this.filterLots();
  }

  ngOnInit() { this.loadLots(); }

  loadLots() {
    const user = this.auth.currentUser;
    const params: any = {};
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
        error: (e) => this.toast.error(e.error?.message || 'Update failed')
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
      this.lotService.create(createPayload).subscribe({
        next: () => { this.toast.success('Parking lot created!'); this.closeModal(); this.loadLots(); },
        error: (e) => this.toast.error(e.error?.message || 'Creation failed')
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
