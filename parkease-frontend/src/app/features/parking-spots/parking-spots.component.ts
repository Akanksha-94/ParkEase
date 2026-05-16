import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ParkingLot, ParkingLotService } from '../../core/services/parking-lot.service';
import { ParkingSpot, ParkingSpotService } from '../../core/services/parking-spot.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-parking-spots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
      <div>
        <h2 style="font-size: 42px; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--text-primary);">Operational Map</h2>
        <p style="color: var(--text-muted); margin-top: 8px;">Live digital twin of physical parking infrastructure</p>
      </div>
      <div class="header-right">
        <div class="sync-status">
          <span class="dot pulse"></span>
          Real-time telemetry active
        </div>
        <button class="zenith-btn primary" (click)="openAddModal()" *ngIf="selectedLotId !== undefined && (isAdmin || isManager)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Spot
        </button>
      </div>
    </div>

    <!-- Modern Configuration Interface -->
    <div class="modern-config-panel glass animate-in" *ngIf="showModal()">
      <div class="panel-header">
        <div class="header-indicator" [class.editing]="editingSpot"></div>
        <div class="header-text">
          <h3>{{ editingSpot ? 'Calibrate Bay Telemetry' : 'Deploy New Infrastructure Bay' }}</h3>
          <p>Precision synchronization for physical parking assets</p>
        </div>
        <button class="close-btn-zenith" (click)="closeModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <form (submit)="submitSpot()" #spotForm="ngForm" class="config-form">
        <div class="config-grid">
          <div class="form-field">
            <label>Bay Identifier</label>
            <input type="text" class="zenith-input" name="spotNumber"
              [(ngModel)]="form.spotNumber" required placeholder="e.g., A-101">
          </div>
          <div class="form-field">
            <label>Floor Vector</label>
            <input type="text" class="zenith-input" name="floor"
              [(ngModel)]="form.floor" placeholder="e.g., B1">
          </div>
          <div class="form-field">
            <label>Fiscal Rate (₹/hr)</label>
            <input type="number" class="zenith-input" name="price"
              [(ngModel)]="form.pricePerHour" required min="0.01" step="0.01">
          </div>
          <div class="form-field">
            <label>Capabilities</label>
            <div class="capability-toggles">
              <label class="cap-toggle" [class.active]="form.evCharging">
                <input type="checkbox" name="evCharging" [(ngModel)]="form.evCharging">
                <span class="cap-icon">⚡</span>
                <span class="cap-text">EV</span>
              </label>
              <label class="cap-toggle" [class.active]="form.handicapped">
                <input type="checkbox" name="handicapped" [(ngModel)]="form.handicapped">
                <span class="cap-icon">♿</span>
                <span class="cap-text">Handicap</span>
              </label>
            </div>
          </div>
        </div>

        <div class="selection-row">
          <div class="selection-group">
            <label>Bay Category</label>
            <div class="radio-group">
              <label class="radio-pill" *ngFor="let type of ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV']" [class.active]="form.spotType === type">
                <input type="radio" name="spotType" [value]="type" [(ngModel)]="form.spotType">
                {{ type }}
              </label>
            </div>
          </div>

          <div class="selection-group">
            <label>Authorized Vehicle Class</label>
            <div class="radio-group">
              <label class="radio-pill" *ngFor="let v of ['TWO_WHEELER', 'FOUR_WHEELER', 'HEAVY']" [class.active]="form.vehicleType === v">
                <input type="radio" name="vehicleType" [value]="v" [(ngModel)]="form.vehicleType">
                {{ v.replace('_', ' ') }}
              </label>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button type="submit" class="zenith-btn primary btn-lg" [disabled]="spotForm.invalid">
            {{ editingSpot ? 'Sync Configuration' : 'Confirm Deployment' }}
          </button>
        </div>
      </form>
    </div>

    <div class="map-layout animate-in">
      <aside class="sidebar-panel glass">
        <div class="panel-section">
          <label>Deployment Zone</label>
          <div class="custom-dropdown" [class.open]="dropdownOpen()">
            <div class="dropdown-selected" (click)="toggleDropdown($event)">
              <span>{{ getSelectedLotName() }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="dropdown-menu" *ngIf="dropdownOpen()">
              <div class="dropdown-item" *ngFor="let lot of lots()" 
                   [class.active]="selectedLotId === lot.lotId" 
                   (click)="selectLot(lot.lotId, $event)">
                {{ lot.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <label>Bay Category Filter</label>
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
          <button class="zenith-btn w-full mt-6" (click)="statusFilter = 'ALL'; filterSpots()">Clear Filter</button>
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
            <span class="status-badge">All Floors</span>
            <h3>Dynamic Infrastructure Grid</h3>
          </div>
          <span class="spots-shown">{{ filteredSpots().length }} spots shown</span>
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
            <rect x="50" y="220" width="800" height="80" rx="10" fill="oklch(var(--foreground) / 3%)" stroke="var(--border-color)" stroke-width="1" />

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

          <div class="actions mt-6" *ngIf="isAdmin || isManager">
            <button class="zenith-btn w-full" (click)="openEditModal(selectedSpot)">
              Edit Spot
            </button>
            <button class="zenith-btn danger w-full" (click)="deleteSpot(selectedSpot.spotId)">
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
  `,
  styles: [`
    .modern-config-panel {
      width: 100%; margin-bottom: 24px; padding: 32px; border-radius: 32px;
      background: oklch(var(--bg-card-raw) / 40%); backdrop-filter: blur(40px);
      border: 1px solid oklch(var(--foreground) / 10%);
      box-shadow: none; /* Explicitly removed as requested */
      .panel-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;
        .header-indicator { width: 4px; height: 32px; background: #10b981; border-radius: 2px; &.editing { background: var(--primary-color); } }
        .header-text { flex: 1; margin-left: 20px; h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; } p { color: var(--text-muted); font-size: 14px; margin-top: 4px; } }
      }
    }

    .close-btn-zenith {
      width: 40px; height: 40px; border-radius: 50%; background: oklch(var(--foreground) / 5%); border: none; color: var(--text-muted); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;
      &:hover { background: oklch(var(--foreground) / 10%); color: var(--text-primary); transform: rotate(90deg); }
      svg { width: 20px; height: 20px; }
    }

    .config-form { display: flex; flex-direction: column; gap: 32px; }
    .config-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    
    .form-field {
      display: flex; flex-direction: column; gap: 10px;
      label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    }

    .zenith-input {
      width: 100%; height: 48px; padding: 0 24px; border-radius: 24px;
      background: oklch(var(--foreground) / 5%); border: 1px solid transparent;
      color: var(--text-primary); font-family: inherit; font-size: 14px; font-weight: 600;
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:focus { border-color: var(--primary-color); background: transparent; outline: none; box-shadow: 0 0 0 4px oklch(var(--primary) / 10%); }
      &::placeholder { color: oklch(var(--foreground) / 30%); }
    }

    .capability-toggles { display: flex; gap: 12px; }
    .cap-toggle {
      flex: 1; height: 48px; border-radius: 24px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.3s;
      input { display: none; }
      .cap-icon { font-size: 18px; filter: grayscale(1); transition: 0.3s; }
      .cap-text { font-size: 12px; font-weight: 700; color: var(--text-muted); }
      &.active { border-color: var(--primary-color); background: oklch(var(--primary) / 10%); .cap-icon { filter: grayscale(0); } .cap-text { color: var(--text-primary); } }
      &:hover:not(.active) { background: oklch(var(--foreground) / 8%); }
    }

    .selection-row { display: flex; gap: 48px; }
    .selection-group {
      flex: 1; display: flex; flex-direction: column; gap: 16px;
      label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    }

    .radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .radio-pill {
      padding: 8px 20px; border-radius: 20px; background: oklch(var(--foreground) / 5%); border: 1px solid transparent;
      color: var(--text-muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.3s;
      input { display: none; }
      &.active { background: var(--primary-color); color: white; border-color: var(--primary-color); box-shadow: 0 4px 15px oklch(var(--primary) / 30%); }
      &:hover:not(.active) { background: oklch(var(--foreground) / 10%); color: var(--text-primary); }
    }

    .form-footer { display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid oklch(var(--foreground) / 5%); }

    .zenith-btn {
      padding: 10px 24px; border-radius: 24px; border: 1px solid var(--border-color);
      background: var(--bg-card); color: var(--text-primary); font-weight: 700; cursor: pointer; transition: 0.3s;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px;
      svg { width: 18px; height: 18px; }
      &.primary { background: var(--primary-color); color: var(--primary-fg); border: none; }
      &:hover { transform: translateY(-2px); background: var(--bg-hover); border-color: var(--primary-color); }
      &.primary:hover { filter: brightness(1.1); border-color: transparent; }
      &.danger { color: #ff4d4d; border-color: transparent; &:hover { background: rgba(255, 77, 77, 0.1); border-color: #ff4d4d; } }
      &.w-full { width: 100%; }
      &.mt-6 { margin-top: 24px; }
      &.btn-lg { height: 48px; padding: 0 40px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; }
    }

    .header-right { display: flex; align-items: center; gap: 24px; }
    .sync-status { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--text-muted); .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981; } .pulse { animation: pulse 2s infinite; } }
    
    .map-layout { display: grid; grid-template-columns: 280px 1fr 320px; gap: 24px; align-items: start; }
    .sidebar-panel, .detail-panel, .map-canvas-container { padding: 24px; border-radius: 24px; background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--border-color); }
    
    .panel-section { margin-bottom: 28px; label { display: block; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.1em; } }
    
    .custom-select { 
      width: 100%; padding: 12px 48px 12px 16px; 
      background: var(--bg-hover); 
      border: 1px solid var(--border-color); 
      border-radius: 12px; 
      color: var(--text-primary); 
      font-family: inherit; font-size: 14px; 
      outline: none; transition: 0.3s; cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='oklch(0.7 0.15 300)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      background-size: 18px;

      &:focus { border-color: var(--primary-color); box-shadow: 0 0 15px var(--primary-glow); background: var(--bg-card); } 
      
      option { 
        background: oklch(var(--background)); 
        color: var(--text-primary);
      }
    }
    
    .custom-dropdown {
      position: relative; width: 100%;
      .dropdown-selected {
        padding: 12px 16px; background: var(--bg-hover); border: 1px solid transparent; border-radius: 12px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 14px; transition: 0.3s;
        svg { width: 16px; height: 16px; color: var(--text-muted); transition: 0.3s; }
        &:hover { border-color: var(--primary-color); }
      }
      &.open .dropdown-selected { border-color: var(--primary-color); box-shadow: 0 0 15px var(--primary-glow); svg { transform: rotate(180deg); } }
      .dropdown-menu {
        position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 8px; box-shadow: 0 10px 40px oklch(var(--foreground) / 20%); z-index: 100; backdrop-filter: blur(20px);
        animation: fade-in-down 0.2s ease-out; max-height: 250px; overflow-y: auto;
      }
      .dropdown-item {
        padding: 10px 16px; border-radius: 10px; color: var(--text-secondary); cursor: pointer; transition: 0.2s; font-size: 14px; font-weight: 500;
        &:hover { background: var(--bg-hover); color: var(--text-primary); }
        &.active { background: oklch(var(--primary) / 15%); color: var(--primary-color); }
      }
    }
    @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    .tag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .tag-btn { background: var(--bg-hover); border: 1px solid transparent; border-radius: 10px; padding: 10px 4px; color: var(--text-muted); font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.3s; &.active { background: oklch(var(--primary) / 15%); color: var(--primary-color); border-color: oklch(var(--primary) / 30%); } &:hover:not(.active) { color: var(--text-primary); border-color: var(--border-color); } }
    
    .status-legend { display: flex; flex-direction: column; gap: 12px; .legend-item { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: 0.2s; &:hover, &.active-filter { color: var(--text-primary); } .box { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; } } }
    
    .spot-count { background: var(--bg-hover); padding: 16px; border-radius: 16px; margin-top: 32px; border: 1px solid var(--border-color); .count-item { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; &:last-child { margin-bottom: 0; } } .dot-avail { width: 10px; height: 10px; border-radius: 50%; background: #10b981; flex-shrink: 0; } .dot-occ { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; flex-shrink: 0; } .dot-res { width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; } }
    
    .canvas-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; .status-badge { display: inline-block; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); margin-bottom: 8px; } .level-info h3 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; } .spots-shown { color: var(--text-muted); font-size: 13px; font-weight: 500; } }
    
    .svg-container { background: oklch(var(--foreground) / 2%); border-radius: 16px; padding: 20px; border: 1px solid var(--border-color); .floor-svg { width: 100%; height: auto; overflow: visible; } }
    .spot-group { cursor: pointer; .spot-rect { fill: oklch(var(--foreground) / 5%); stroke: var(--border-color); stroke-width: 1.5; transition: 0.3s; } .spot-label { fill: var(--text-secondary); font-size: 9px; font-weight: 800; text-anchor: middle; pointer-events: none; } .spot-type { fill: var(--text-muted); font-size: 7px; text-anchor: middle; pointer-events: none; } &:hover .spot-rect { stroke: var(--primary-color); stroke-width: 2; } &.selected .spot-rect { fill: oklch(var(--primary) / 10%); stroke: var(--primary-color); stroke-width: 2.5; filter: url(#neon-glow); } &.available .spot-rect { stroke: #10b981; } &.occupied .spot-rect { stroke: #ef4444; } &.reserved .spot-rect { stroke: #f59e0b; } &.maintenance .spot-rect { stroke: #94a3b8; } }
    .road-label { fill: var(--text-muted); font-size: 16px; font-weight: 600; text-anchor: middle; }
    
    .detail-panel { display: flex; flex-direction: column; }
    .panel-header { margin-bottom: 24px; h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; } p { color: var(--text-muted); font-size: 13px; } }
    
    .hero-id { margin-bottom: 24px; padding: 20px; background: var(--bg-hover); border-radius: 16px; border: 1px solid var(--border-color); display: flex; flex-direction: column; position: relative; overflow: hidden; .label { font-size: 11px; font-weight: 800; color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px; } .value { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-top: 4px; } &::after { content: ''; position: absolute; right: -20px; bottom: -20px; width: 100px; height: 100px; background: var(--primary-color); filter: blur(50px); opacity: 0.2; pointer-events: none; } }
    
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; .data-item { display: flex; flex-direction: column; .lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; } .val { font-size: 13px; font-weight: 700; color: var(--text-primary); } } }
    
    .actions { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
    
    .empty-intel { padding: 60px 24px; text-align: center; color: var(--text-muted); flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; svg { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.2; } p { font-size: 13px; line-height: 1.5; font-weight: 500; } }
    .modal-box { width: 500px; padding: 40px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.5rem; } }
    .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; &:hover { color: var(--text-primary); } }
    .btn-danger-text { color: hsl(var(--danger)); &:hover { background: hsla(var(--danger), 0.1); } }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; input { width: 16px; height: 16px; accent-color: var(--primary); } }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
  `]
})
export class ParkingSpotsComponent implements OnInit {
  private spotService = inject(ParkingSpotService);
  private lotService = inject(ParkingLotService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }
  get isManager(): boolean { return this.auth.role === 'MANAGER'; }

  lots = signal<ParkingLot[]>([]);
  spots = signal<ParkingSpot[]>([]);
  filteredSpots = signal<ParkingSpot[]>([]);
  showModal = signal(false);
  dropdownOpen = signal(false);

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

  public defaultForm() {
    return { spotNumber: '', floor: '', spotType: 'STANDARD', vehicleType: 'FOUR_WHEELER', pricePerHour: 5, evCharging: false, handicapped: false };
  }

  get floorSpots(): ParkingSpot[] { return this.filteredSpots().slice(0, 40); }

  availableCount = signal(0);
  occupiedCount = signal(0);
  reservedCount = signal(0);

  getSelectedLotName(): string {
    if (this.selectedLotId === undefined) return 'Select a lot';
    const lot = this.lots().find(l => l.lotId === this.selectedLotId);
    return lot ? lot.name : 'Select a lot';
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  selectLot(lotId: number, event: Event) {
    event.stopPropagation();
    this.selectedLotId = lotId;
    this.dropdownOpen.set(false);
    this.loadSpots();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.dropdownOpen.set(false);
    }
  }

  ngOnInit() {
    const user = this.auth.currentUser;
    const params: any = {};
    if (user?.role === 'MANAGER') params.managerId = user.userId || user.id;

    this.lotService.getAll(params).subscribe(lots => {
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
