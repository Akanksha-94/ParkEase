import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, PlatformSummary } from '../../core/services/analytics.service';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
      <div class="header-main">
        <div class="header-indicator"></div>
        <div>
          <h2>Executive Intelligence</h2>
          <p>Real-time telemetry and network performance metrics</p>
        </div>
      </div>
      <div class="status-badge-zenith" [class.refreshing]="isRefreshing()">
        <span class="pulse-dot"></span>
        {{ isRefreshing() ? 'SYNCHRONIZING...' : 'LIVE GRID TELEMETRY' }}
      </div>
    </div>

    <div class="analytics-layout animate-in">
      <!-- Top KPIs -->
      <div class="kpi-grid">
        <div class="zenith-stat-card glass" *ngFor="let card of cards()">
          <div class="card-inner">
            <div class="card-top">
              <span class="card-label">{{ card.label }}</span>
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path [attr.d]="card.iconPath"/></svg>
              </div>
            </div>
            <div class="card-main">
              <span class="card-value">{{ card.value }}</span>
              <div class="card-trend up" *ngIf="card.label === 'Total Revenue' || card.label === 'Occupancy Rate'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17l9-9M17 17V7H7"/></svg>
                12%
              </div>
            </div>
          </div>
          <div class="card-visual-spark"></div>
        </div>
      </div>

      <!-- Lot Selector -->
      <div class="lot-selector-panel mt-8">
        <div class="panel-left">
          <span class="panel-label">Target Infrastructure</span>
          <div class="custom-dropdown lot-select" (click)="toggleDropdown($event)">
            <div class="selected-value" [class.placeholder]="!selectedLotId">
              {{ getSelectedLotName() }}
              <svg class="chevron" [class.open]="dropdownOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            <div class="dropdown-list" *ngIf="dropdownOpen()">
              <div class="dropdown-item" [class.active]="!selectedLotId" (click)="selectLot(null, $event)">
                <div class="item-icon">A</div>
                <div class="item-info">
                  <span class="item-name">All Connected Lots</span>
                  <span class="item-meta">Platform-wide aggregation</span>
                </div>
                <div class="active-indicator" *ngIf="!selectedLotId"></div>
              </div>
              <div class="dropdown-item" *ngFor="let lot of lots()" [class.active]="selectedLotId === lot.lotId" (click)="selectLot(lot.lotId, $event)">
                <div class="item-icon">L</div>
                <div class="item-info">
                  <span class="item-name">{{ lot.name }}</span>
                  <span class="item-meta">{{ lot.city }} • {{ lot.totalSpots }} Bays</span>
                </div>
                <div class="active-indicator" *ngIf="selectedLotId === lot.lotId"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mini-telemetry" *ngIf="lotStats()">
          <div class="tel-item">
            <span class="lab">CAPACITY</span>
            <span class="val">{{ lotStats()?.occupancy }}%</span>
          </div>
          <div class="tel-item">
            <span class="lab">VELOCITY</span>
            <span class="val">{{ lotStats()?.revenue | currency }}</span>
          </div>
          <div class="tel-item">
            <span class="lab">AVG STAY</span>
            <span class="val">{{ lotStats()?.avgDuration }}m</span>
          </div>
        </div>
      </div>

      <!-- Main Charts Section -->
      <div class="charts-grid mt-8" *ngIf="selectedLotId">
        <!-- Live Occupancy Area Chart -->
        <div class="chart-container glass main-chart">
          <div class="chart-header">
            <div class="header-info">
              <h3>Occupancy Flux</h3>
              <p>Real-time capacity utilization across the temporal window</p>
            </div>
          </div>
          <div class="svg-wrapper">
            <svg viewBox="0 0 720 280" class="occupancy-svg">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary-color)" stop-opacity="0.3"></stop>
                  <stop offset="100%" stop-color="var(--primary-color)" stop-opacity="0"></stop>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
              </defs>
              
              <!-- Grid Lines -->
              <line x1="40" y1="40" x2="680" y2="40" stroke="oklch(var(--foreground) / 5%)" stroke-dasharray="4"></line>
              <line x1="40" y1="130" x2="680" y2="130" stroke="oklch(var(--foreground) / 5%)" stroke-dasharray="4"></line>
              <line x1="40" y1="220" x2="680" y2="220" stroke="oklch(var(--foreground) / 10%)"></line>

              <!-- Main Data -->
              <path class="chart-fill" [attr.d]="occupancyAreaPath()" fill="url(#areaGrad)"></path>
              <path class="chart-stroke" [attr.d]="occupancyLinePath()" filter="url(#glow)"></path>
              
              <g *ngFor="let pt of chartPoints(); let i = index">
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="6" class="point-glow"></circle>
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" class="point-core"></circle>
              </g>

              <!-- X axis -->
              <text *ngFor="let h of hourLabels; let i = index" 
                    [attr.x]="40 + i * (640/11)" y="265" class="axis-text time">{{ h }}</text>
            </svg>
          </div>
        </div>

        <!-- Live Telemetry Stream -->
        <div class="chart-container glass side-chart">
          <div class="chart-header">
            <div class="header-info">
              <h3>Live Telemetry Stream</h3>
              <p>Real-time event synchronization</p>
            </div>
            <div class="telemetry-count">{{ telemetryEvents().length }} EVENTS</div>
          </div>
          <div class="telemetry-feed">
            <div class="telemetry-item" *ngFor="let event of telemetryEvents()" [class.new]="event.isNew">
              <div class="event-icon" [style.background]="event.type === 'ENTRY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 212, 255, 0.1)'">
                <svg *ngIf="event.type === 'ENTRY'" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"/></svg>
                <svg *ngIf="event.type === 'EXIT'" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="3"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M19.8 12H9"/></svg>
              </div>
              <div class="event-info">
                <span class="event-title">{{ event.title }}</span>
                <span class="event-meta">{{ event.subtitle }} • {{ event.time }}</span>
              </div>
              <div class="event-status" [style.color]="event.type === 'ENTRY' ? '#10b981' : '#00d4ff'">{{ event.type }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue by Day -->
      <div class="chart-container glass full-chart mt-8" *ngIf="revenueByDay().length > 0">
        <div class="chart-header">
          <div class="header-info">
            <h3>Fiscal Velocity Timeline</h3>
            <p>14-day rolling revenue performance metrics</p>
          </div>
          <div class="header-summary">
            <div class="sync-indicator" *ngIf="!selectedDay()">
              <span class="sync-dot"></span>
              <span class="sync-label">LIVE TELEMETRY</span>
            </div>
            <button class="reset-btn" *ngIf="selectedDay()" (click)="selectedDay.set(null)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              RESET TO AVG
            </button>
            <div class="summary-group" [class.highlight]="selectedDay()">
              <span class="sum-label">{{ selectedDay() ? (selectedDay()?.date | date:'MMM dd, yyyy') : 'Rolling Avg' }}</span>
              <span class="sum-val">{{ (selectedDay() ? selectedDay()?.amount : getRollingAvg()) | currency }}</span>
            </div>
          </div>
        </div>
        <div class="bar-timeline">
          <div class="grid-lines">
            <span></span><span></span><span></span>
          </div>
          <div *ngFor="let r of revenueByDay()" class="bar-column" (click)="selectedDay.set(r)">
            <div class="bar-wrapper">
              <div class="bar-peak" [style.height.%]="r.pct" [class.active]="selectedDay()?.date === r.date">
                <div class="bar-glow"></div>
                <div class="bar-tooltip">{{ r.amount | currency }}</div>
                <div class="peak-dot"></div>
              </div>
            </div>
            <span class="bar-label" [class.active]="selectedDay()?.date === r.date">{{ r.date | date:'dd' }}</span>
          </div>
        </div>
      </div>
      <!-- Infrastructure Health Grid -->
      <div class="chart-container glass mt-8" *ngIf="lots().length > 0">
        <div class="chart-header">
          <div class="header-info">
            <h3>Network Infrastructure Health</h3>
            <p>Real-time operational status of all deployment zones</p>
          </div>
          <button class="zenith-btn primary btn-xs">Generate Audit Report</button>
        </div>
        <div class="health-grid">
          <div class="health-card" *ngFor="let lot of lots()">
            <div class="health-top">
              <span class="id">ZN-{{ lot.lotId }}</span>
              <span class="indicator" [style.background]="lot.isOpen ? '#10b981' : '#f59e0b'"></span>
            </div>
            <div class="health-main">
              <h4>{{ lot.name }}</h4>
              <p>{{ lot.address }}</p>
            </div>
            <div class="health-stats">
              <div class="stat"><span>Occupancy</span><strong>{{ getLotOccupancyRate(lot) }}%</strong></div>
              <div class="stat"><span>Sync</span><strong>Optimal</strong></div>
            </div>
            <div class="health-track">
              <div class="fill" [style.width.%]="getLotOccupancyRate(lot)" [style.background]="getLotOccupancyRate(lot) > 80 ? '#ef4444' : '#10b981'"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-main { display: flex; align-items: center; gap: 24px; .header-indicator { width: 4px; height: 48px; background: #10b981; border-radius: 2px; } h2 { font-size: 38px; font-weight: 800; letter-spacing: -1px; margin: 0; } p { color: var(--text-muted); margin: 4px 0 0 0; } }
    .status-badge-zenith { 
      display: flex; align-items: center; gap: 10px; padding: 8px 16px; 
      background: oklch(var(--foreground) / 5%); border: 1px solid oklch(var(--foreground) / 10%); 
      border-radius: 100px; font-size: 11px; font-weight: 900; letter-spacing: 1px; color: var(--text-primary);
      transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &.refreshing { background: oklch(var(--primary) / 10%); border-color: oklch(var(--primary) / 30%); color: var(--primary-color); }
      .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 12px rgba(16, 185, 129, 0.4); animation: live-pulse 2s infinite; } 
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .zenith-stat-card {
      position: relative; border-radius: 28px; overflow: hidden; background: oklch(var(--bg-card-raw) / 40%); backdrop-filter: blur(20px); border: 1px solid oklch(var(--foreground) / 10%); transition: 0.4s;
      &:hover { border-color: oklch(var(--primary) / 30%); transform: translateY(-4px); }
      .card-inner { padding: 24px; display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 1; }
      .card-top { display: flex; justify-content: space-between; align-items: center; .card-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } .card-icon { color: var(--primary-color); svg { width: 18px; height: 18px; } } }
      .card-main { display: flex; align-items: flex-end; gap: 12px; .card-value { font-size: 32px; font-weight: 900; color: var(--text-primary); } .card-trend { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #ef4444; &.up { color: #10b981; } svg { width: 12px; height: 12px; } } }
      .card-visual-spark { position: absolute; bottom: 0; left: 0; right: 0; height: 30px; opacity: 0.4; }
    }

    .lot-selector-panel {
      position: relative; z-index: 1000;
      padding: 24px 32px; border-radius: 24px; display: flex; justify-content: space-between; align-items: center; 
      background: var(--bg-base); border: 1px solid oklch(var(--foreground) / 10%);
      box-shadow: 0 10px 30px oklch(0 0 0 / 20%);
      .panel-left { display: flex; align-items: center; gap: 24px; .panel-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; } }
      .lot-select { min-width: 320px; }
    }

    .custom-dropdown {
      position: relative; height: 48px; border-radius: 24px; background: oklch(var(--foreground) / 8%); border: 1px solid oklch(var(--foreground) / 10%); cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { background: oklch(var(--foreground) / 12%); border-color: oklch(var(--primary) / 40%); box-shadow: 0 4px 20px oklch(0 0 0 / 10%); }
      .selected-value { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; font-weight: 800; font-size: 13px; color: var(--text-primary); }
      .chevron { width: 14px; height: 14px; transition: 0.4s; color: var(--text-muted); &.open { transform: rotate(180deg); color: var(--primary-color); } }
      .dropdown-list {
        position: absolute; top: calc(100% + 12px); left: 0; right: 0; z-index: 100; padding: 12px; border-radius: 24px; max-height: 320px; overflow-y: auto; 
        background: var(--bg-base); border: 1px solid oklch(var(--foreground) / 20%); box-shadow: 0 40px 80px oklch(0 0 0 / 50%); animation: dropdown-slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .dropdown-item {
        position: relative; display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 16px; transition: 0.2s; margin-bottom: 4px;
        &:last-child { margin-bottom: 0; }
        &:hover { background: oklch(var(--foreground) / 5%); .item-icon { background: var(--primary-color); color: white; } }
        &.active { background: oklch(var(--primary) / 10%); .item-name { color: var(--primary-color); } .item-icon { background: var(--primary-color); color: white; } }
        .item-icon { width: 36px; height: 36px; border-radius: 12px; background: oklch(var(--foreground) / 8%); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; transition: 0.3s; }
        .item-info { display: flex; flex-direction: column; }
        .item-name { font-weight: 800; font-size: 14px; color: var(--text-primary); transition: 0.2s; }
        .item-meta { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .active-indicator { position: absolute; right: 16px; width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); box-shadow: 0 0 10px var(--primary-color); }
      }
    }

    @keyframes dropdown-slide {
      from { opacity: 0; transform: translateY(-10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .mini-telemetry { display: flex; align-items: center; gap: 32px; .tel-item { display: flex; flex-direction: column; .lab { font-size: 9px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; } .val { font-size: 16px; font-weight: 800; color: var(--primary-color); } } }

    .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .chart-container { border-radius: 32px; padding: 32px; border: 1px solid oklch(var(--foreground) / 8%); }
    .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; h3 { font-size: 20px; font-weight: 800; margin: 0; } p { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; } }

    .telemetry-feed { display: flex; flex-direction: column; gap: 16px; max-height: 240px; overflow-y: auto; padding-right: 10px; }
    .telemetry-item { 
      display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; background: oklch(var(--foreground) / 3%); border: 1px solid transparent; transition: 0.3s;
      &.new { border-color: oklch(var(--primary) / 30%); background: oklch(var(--primary) / 5%); animation: entry-glow 2s infinite; }
      .event-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; svg { width: 18px; height: 18px; } }
      .event-info { flex: 1; display: flex; flex-direction: column; .event-title { font-size: 13px; font-weight: 800; color: var(--text-primary); } .event-meta { font-size: 10px; color: var(--text-muted); font-weight: 600; } }
      .event-status { font-size: 9px; font-weight: 900; letter-spacing: 1px; }
    }
    @keyframes entry-glow { 0% { box-shadow: 0 0 0 0 oklch(var(--primary) / 20%); } 70% { box-shadow: 0 0 0 10px oklch(var(--primary) / 0%); } 100% { box-shadow: 0 0 0 0 oklch(var(--primary) / 0%); } }

    .health-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .health-card { 
      padding: 24px; border-radius: 24px; background: oklch(var(--foreground) / 3%); border: 1px solid oklch(var(--foreground) / 5%); transition: 0.3s;
      &:hover { transform: translateY(-4px); background: oklch(var(--foreground) / 5%); border-color: oklch(var(--foreground) / 10%); }
      .health-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; .id { font-size: 10px; font-weight: 900; color: var(--text-muted); } .indicator { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px currentColor; } }
      .health-main { margin-bottom: 20px; h4 { margin: 0; font-size: 16px; font-weight: 800; } p { margin: 4px 0 0; font-size: 11px; color: var(--text-muted); } }
      .health-stats { display: flex; gap: 20px; margin-bottom: 20px; .stat { display: flex; flex-direction: column; span { font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } strong { font-size: 12px; font-weight: 800; } } }
      .health-track { height: 6px; border-radius: 3px; background: oklch(var(--foreground) / 5%); overflow: hidden; .fill { height: 100%; border-radius: 3px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); } }
    }

    .svg-wrapper { width: 100%; height: 280px; .occupancy-svg { width: 100%; height: 100%; overflow: visible; } }
    .chart-stroke { fill: none; stroke: var(--primary-color); stroke-width: 3; stroke-linecap: round; }
    .point-glow { fill: var(--primary-color); opacity: 0.2; }
    .point-core { fill: white; stroke: var(--primary-color); stroke-width: 2; }
    .axis-text { fill: var(--text-muted); font-size: 9px; font-weight: 800; text-anchor: middle; }

    .donut-wrapper { display: flex; flex-direction: column; align-items: center; gap: 32px; }
    .donut-svg { width: 180px; height: 180px; transform: rotate(-90deg); }
    .donut-segment { transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .donut-center-text { fill: var(--text-muted); font-size: 10px; font-weight: 800; text-anchor: middle; transform: rotate(90deg); transform-origin: center; }

    .allocation-list { width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .alloc-item { 
      .item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; .dot { width: 6px; height: 6px; border-radius: 50%; } .type { flex: 1; font-size: 11px; font-weight: 800; color: var(--text-primary); } .pct { font-size: 11px; font-weight: 900; color: var(--text-muted); } }
      .progress-bar { height: 4px; border-radius: 2px; background: oklch(var(--foreground) / 5%); overflow: hidden; .fill { height: 100%; border-radius: 2px; transition: 1s cubic-bezier(0.23, 1, 0.32, 1); } }
    }

    .bar-timeline { 
      position: relative; display: flex; align-items: flex-end; height: 200px; gap: 16px; padding: 0 20px; 
      .grid-lines { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; opacity: 0.1; span { border-bottom: 1px dashed var(--text-muted); width: 100%; height: 1px; } }
    }
    .bar-column { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 16px; z-index: 1; }
    .bar-wrapper { width: 100%; height: 160px; display: flex; align-items: flex-end; justify-content: center; }
    .bar-peak { 
      width: 14px; border-radius: 7px; 
      background: linear-gradient(to top, var(--primary-color), oklch(var(--primary) / 60%)); 
      position: relative; transition: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      &:hover { 
        width: 18px; filter: brightness(1.2); 
        .bar-glow { opacity: 0.8; transform: scale(1.4); } 
        .bar-tooltip { opacity: 1; transform: translate(-50%, -10px); }
        .peak-dot { opacity: 1; transform: scale(1); }
      }
    }
    .bar-glow { position: absolute; inset: -4px; border-radius: 20px; background: var(--primary-color); filter: blur(12px); opacity: 0.2; transition: 0.4s; pointer-events: none; }
    .bar-tooltip { 
      position: absolute; top: -35px; left: 50%; transform: translate(-50%, 0); 
      background: var(--text-primary); color: var(--bg-base); padding: 4px 10px; border-radius: 8px; 
      font-size: 10px; font-weight: 900; opacity: 0; transition: 0.3s; pointer-events: none; white-space: nowrap;
      &::after { content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid var(--text-primary); }
    }
    .peak-dot { position: absolute; top: -4px; left: 50%; transform: translate(-50%, 0) scale(0); width: 6px; height: 6px; background: white; border-radius: 50%; box-shadow: 0 0 10px white; opacity: 0; transition: 0.3s; }
    .bar-label { font-size: 11px; font-weight: 900; color: var(--text-muted); transition: 0.3s; &:hover { color: var(--primary-color); } }

    .header-summary { 
      text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
      .sync-indicator { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 6px; background: oklch(var(--primary) / 10%); .sync-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); animation: sync-pulse 2s infinite; } .sync-label { font-size: 8px; font-weight: 900; color: var(--primary-color); letter-spacing: 1px; } }
      .reset-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--primary-color); font-size: 9px; font-weight: 900; cursor: pointer; padding: 4px 0; transition: 0.3s; &:hover { letter-spacing: 1px; } svg { width: 12px; height: 12px; } }
      .summary-group { transition: 0.4s; &.highlight { transform: scale(1.05); .sum-label { color: var(--primary-color); } .sum-val { color: var(--text-primary); } } .sum-label { display: block; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } .sum-val { font-size: 24px; font-weight: 900; color: #10b981; } }
    }
    .bar-peak.active { background: #fff !important; box-shadow: 0 0 20px #fff; .peak-dot { opacity: 1; transform: scale(1.5); } .bar-glow { opacity: 1; background: #fff; } }
    .bar-label.active { color: var(--primary-color); transform: translateY(-4px); }
    @keyframes sync-pulse { 0% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 10px var(--primary-color); } 100% { opacity: 0.4; transform: scale(1); } }
    .empty-state-simple { text-align: center; padding: 60px 0; .empty-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.3; } p { color: var(--text-muted); font-weight: 600; } }

    @keyframes live-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    @media (max-width: 1200px) { .charts-grid { grid-template-columns: 1fr; } .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private analytics = inject(AnalyticsService);
  private lotService = inject(ParkingLotService);
  private auth = inject(AuthService);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }

  lots = signal<ParkingLot[]>([]);
  selectedLotId: number | null = null;
  lotStats = signal<{ occupancy: number; revenue: number; avgDuration: number } | null>(null);
  peakHours = signal<number[]>([]);
  occupancyHours = signal<number[]>(Array(12).fill(0));
  spotTypes = signal<{ type: string; count: number; percent: number; color: string }[]>([]);
  revenueByDay = signal<{ date: string; amount: number; pct: number }[]>([]);
  selectedDay = signal<{ date: string; amount: number } | null>(null);
  telemetryEvents = signal<{ title: string; subtitle: string; time: string; type: 'ENTRY' | 'EXIT'; isNew?: boolean }[]>([]);

  hourLabels = ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

  private mockEvents = [
    { title: 'Vessel ZN-402 Entered', subtitle: 'Sector Skylight • Bay 12', time: '2m ago', type: 'ENTRY', isNew: true },
    { title: 'Vessel ZN-109 Exited', subtitle: 'Sector LandRight • Bay 05', time: '5m ago', type: 'EXIT' },
    { title: 'Vessel ZN-882 Entered', subtitle: 'Sector LandArea • Bay 01', time: '12m ago', type: 'ENTRY' },
    { title: 'Vessel ZN-221 Exited', subtitle: 'Sector Skylight • Bay 18', time: '15m ago', type: 'EXIT' }
  ];

  cards = signal([
    { label: 'Total Lots', value: '0', iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { label: 'Total Revenue', value: '$0', iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { label: 'Occupancy Rate', value: '0%', iconPath: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z' },
    { label: 'Active Sessions', value: '0', iconPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
  ]);

  dropdownOpen = signal(false);
  isRefreshing = signal(false);
  private refreshSubscription?: Subscription;

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

  selectLot(lotId: number | null, event: Event) {
    event.stopPropagation();
    this.selectedLotId = lotId;
    this.dropdownOpen.set(false);
    this.loadLotAnalytics();
  }

  getSelectedLotName(): string {
    if (!this.selectedLotId) return 'All Connected Infrastructure';
    const lot = this.lots().find(l => l.lotId === this.selectedLotId);
    return lot ? lot.name : 'All Connected Infrastructure';
  }

  ngOnInit(): void {
    this.refreshData();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling() {
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.refreshData();
    });
  }

  private stopPolling() {
    this.refreshSubscription?.unsubscribe();
  }

  refreshData() {
    this.isRefreshing.set(true);
    this.telemetryEvents.set(this.mockEvents as any);
    const user = this.auth.currentUser;
    const params: any = {};
    if (user?.role === 'MANAGER') params.managerId = user.userId || user.id;

    // Refresh lot list (only if not already loaded or for updates)
    if (this.lots().length === 0) {
      this.lotService.getAll(params).subscribe(lots => this.lots.set(lots));
    }

    // Refresh Platform Summary
    this.analytics.getPlatformSummary().subscribe({
      next: (summary) => {
        this.cards.set([
          { label: 'Total Lots', value: this.lots().length.toString(), iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
          { label: 'Total Revenue', value: '$' + summary.dailyRevenue.toLocaleString(), iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
          { label: 'Occupancy Rate', value: Math.round(summary.platformOccupancyRate) + '%', iconPath: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z' },
          { label: 'Active Sessions', value: (summary.totalSpots - summary.availableSpots).toString(), iconPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
        ]);
        setTimeout(() => this.isRefreshing.set(false), 800);
      },
      error: () => this.isRefreshing.set(false)
    });

    // Refresh current lot stats if one is selected
    if (this.selectedLotId) {
      this.loadLotAnalytics();
    }
  }

  loadLotAnalytics() {
    if (!this.selectedLotId) { this.clearLotData(); return; }
    const id = Number(this.selectedLotId);

    forkJoin({
      occupancy: this.analytics.getOccupancyRate(id),
      revenue: this.analytics.getRevenue(id),
      avgDur: this.analytics.getAvgDuration(id),
      byHour: this.analytics.getOccupancyByHour(id),
      peaks: this.analytics.getPeakHours(id),
      spotTypes: this.analytics.getSpotTypes(id),
      revByDay: this.analytics.getRevenueByDay(id)
    }).subscribe({
      next: ({ occupancy, revenue, avgDur, byHour, peaks, spotTypes, revByDay }) => {
        this.lotStats.set({ occupancy: occupancy ?? 0, revenue: revenue ?? 0, avgDuration: avgDur ?? 0 });
        this.peakHours.set(peaks ?? []);

        const hours = Array.from({ length: 12 }, (_, i) => byHour?.[i * 2] ?? 0);
        this.occupancyHours.set(hours);

        const colors = ['#10b981', '#00d4ff', '#f59e0b', '#ef4444', '#8b5cf6'];
        const total = Object.values(spotTypes ?? {}).reduce((a, b) => a + b, 0) || 1;
        this.spotTypes.set(Object.entries(spotTypes ?? {}).map(([type, count], i) => ({
          type, count: count as number, percent: Math.round((count as number) / total * 100), color: colors[i % colors.length]
        })));

        const today = new Date();
        const normalizedRevs = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - (13 - i));
          const dateStr = d.toISOString().split('T')[0];
          const amount = revByDay?.[dateStr] as number || 0;
          return { date: dateStr, amount };
        });

        const maxRev = Math.max(...normalizedRevs.map(r => r.amount), 1);
        this.revenueByDay.set(normalizedRevs.map(r => ({
          ...r, pct: Math.round(r.amount / maxRev * 100)
        })));
      },
      error: () => this.clearLotData()
    });
  }

  clearLotData() {
    this.lotStats.set(null);
    this.peakHours.set([]);
    this.occupancyHours.set(Array(12).fill(0));
    this.spotTypes.set([]);
    this.revenueByDay.set([]);
  }

  chartPoints() {
    const hours = this.occupancyHours();
    const w = 640; const h = 180;
    return hours.map((val, i) => ({
      x: 40 + (i / (hours.length - 1)) * w,
      y: 220 - (val / 100) * h
    }));
  }

  occupancyLinePath(): string {
    const pts = this.chartPoints();
    if (pts.length < 2) return '';
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C${cp1x},${p0.y} ${cp1x},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  }

  occupancyAreaPath(): string {
    const line = this.occupancyLinePath();
    if (!line) return '';
    const pts = this.chartPoints();
    return line + ` L${pts[pts.length - 1].x},220 L${pts[0].x},220 Z`;
  }

  getSegmentOffset(index: number): string {
    let offset = 0;
    const types = this.spotTypes();
    for (let i = 0; i < index; i++) {
      offset += types[i].percent;
    }
    return (100 - offset) + '';
  }

  getRollingAvg(): number {
    const revs = this.revenueByDay();
    if (revs.length === 0) return 0;
    return revs.reduce((a, b) => a + b.amount, 0) / revs.length;
  }

  getLotOccupancyRate(lot: ParkingLot): number {
    if (!lot.totalSpots) return 0;
    return Math.round(((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100);
  }
}
