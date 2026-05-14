import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, PlatformSummary } from '../../core/services/analytics.service';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Operational Intelligence</h2>
        <p>Real-time telemetry and fiscal velocity analytics across the network.</p>
      </div>
      <div class="status-badge">
        <span class="dot pulse"></span>
        LIVE FEED
      </div>
    </div>

    <div class="page-content animate-in">
      <!-- Platform-wide KPI Cards -->
      <div class="grid grid-cols-4 gap-6 mb-10">
        <div class="stat-card glass" *ngFor="let card of cards()">
          <div class="header">
            <span class="label">{{ card.label }}</span>
            <div class="icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path [attr.d]="card.iconPath"></path></svg>
            </div>
          </div>
          <div class="value font-heading">{{ card.value }}</div>
          <div class="visual-line"></div>
        </div>
      </div>

      <!-- Lot Selector -->
      <div class="lot-selector-bar glass mb-8">
        <label class="selector-label">Analyze Lot</label>
        <select class="form-control lot-select" [(ngModel)]="selectedLotId" (change)="loadLotAnalytics()">
          <option [value]="null">— Select a lot —</option>
          <option *ngFor="let lot of lots()" [value]="lot.lotId">{{ lot.name }} ({{ lot.city }})</option>
        </select>
        <div class="lot-kpi-row" *ngIf="lotStats()">
          <div class="kpi">
            <span class="kpi-label">Occupancy</span>
            <span class="kpi-val">{{ lotStats()?.occupancy ?? 0 | number:'1.0-1' }}%</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Revenue</span>
            <span class="kpi-val">{{ lotStats()?.revenue ?? 0 | currency }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Avg Duration</span>
            <span class="kpi-val">{{ lotStats()?.avgDuration ?? 0 | number:'1.0-1' }} hrs</span>
          </div>
          <div class="kpi" *ngIf="peakHours().length > 0">
            <span class="kpi-label">Peak Hours</span>
            <span class="kpi-val">{{ peakHours().slice(0,3).join(':00, ') }}:00</span>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        <!-- Occupancy by Hour Chart -->
        <div class="chart-box glass">
          <div class="box-header">
            <h3>Infrastructure Utilization</h3>
            <p>{{ selectedLotId ? '24-hour occupancy velocity mapping' : 'Select a lot to see real data' }}</p>
          </div>
          <div class="svg-container">
            <svg viewBox="0 0 700 280" class="premium-chart">
              <defs>
                <linearGradient id="lineGrad" x1="0" x2="1">
                  <stop offset="0%" stop-color="var(--primary)" />
                  <stop offset="100%" stop-color="var(--accent)" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="hsla(var(--p-primary), 0.3)" />
                  <stop offset="100%" stop-color="transparent" />
                </linearGradient>
              </defs>
              <g class="grid-lines">
                <line x1="40" y1="40" x2="680" y2="40" />
                <line x1="40" y1="100" x2="680" y2="100" />
                <line x1="40" y1="160" x2="680" y2="160" />
                <line x1="40" y1="220" x2="680" y2="220" />
              </g>
              <!-- Y axis labels -->
              <text x="30" y="44" class="axis-label">100%</text>
              <text x="30" y="104" class="axis-label">75%</text>
              <text x="30" y="164" class="axis-label">50%</text>
              <text x="30" y="224" class="axis-label">25%</text>
              <!-- X axis labels -->
              <text *ngFor="let h of hourLabels; let i = index" [attr.x]="40 + i * (640/11)" y="268" class="axis-label">{{ h }}</text>

              <path class="chart-area" [attr.d]="occupancyAreaPath()" />
              <path class="chart-line" [attr.d]="occupancyLinePath()" />
              <circle *ngFor="let pt of chartPoints(); let i = index"
                [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="var(--bg-base)" stroke="var(--primary)" stroke-width="2" />
            </svg>
          </div>
        </div>

        <!-- Spot Types Distribution -->
        <div class="chart-box glass">
          <div class="box-header">
            <h3>Resource Allocation</h3>
            <p>Spot type usage distribution</p>
          </div>
          <div class="distribution-stack" *ngIf="spotTypes().length > 0; else noData">
            <div class="dist-item" *ngFor="let item of spotTypes()">
              <div class="flex justify-between mb-2">
                <span class="label">{{ item.type }}</span>
                <span class="val">{{ item.count }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="item.percent" [style.background]="item.color"></div>
              </div>
            </div>
          </div>
          <ng-template #noData>
            <div class="no-data-msg">
              <p>{{ selectedLotId ? 'No spot type data available.' : 'Select a lot to view allocation.' }}</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Revenue by Day -->
      <div class="chart-box glass mt-6" *ngIf="revenueByDay().length > 0">
        <div class="box-header">
          <h3>Revenue Timeline</h3>
          <p>Daily revenue over the past {{ revenueByDay().length }} days</p>
        </div>
        <div class="rev-bars">
          <div *ngFor="let r of revenueByDay()" class="rev-bar-col">
            <div class="rev-bar" [style.height.%]="r.pct" [title]="r.date + ': ' + (r.amount | currency)"></div>
            <span class="rev-day">{{ r.date | date:'d MMM' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-badge { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: hsla(255,255%,255%,0.05); border: 1px solid var(--border); border-radius: 99px; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; } }

    .stat-card {
      padding: 24px; display: flex; flex-direction: column; gap: 12px; position: relative;
      .header { display: flex; justify-content: space-between; align-items: flex-start; .label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } .icon-wrap { color: var(--primary); svg { width: 18px; height: 18px; } } }
      .value { font-size: 2.25rem; color: #fff; }
      .visual-line { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--primary), transparent); }
    }

    .lot-selector-bar { padding: 20px 24px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; border-radius: var(--radius-lg); .selector-label { font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; } .lot-select { max-width: 280px; } }
    .lot-kpi-row { display: flex; gap: 28px; flex-wrap: wrap; }
    .kpi { display: flex; flex-direction: column; .kpi-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } .kpi-val { font-size: 1.25rem; font-weight: 800; color: var(--primary); font-family: 'Outfit'; } }

    .analytics-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
    .chart-box { padding: 28px; .box-header { margin-bottom: 24px; h3 { font-size: 1.25rem; margin-bottom: 4px; } p { font-size: 13px; color: var(--text-muted); } } }

    .premium-chart { width: 100%; height: auto; .grid-lines line { stroke: var(--border); stroke-dasharray: 4 4; } .chart-area { fill: url(#areaGrad); } .chart-line { fill: none; stroke: url(#lineGrad); stroke-width: 3; stroke-linecap: round; filter: drop-shadow(0 0 10px var(--primary-glow)); } .axis-label { fill: var(--text-muted); font-size: 8px; text-anchor: middle; } }

    .distribution-stack { display: flex; flex-direction: column; gap: 20px; }
    .dist-item { .label { font-size: 12px; font-weight: 700; color: var(--text-secondary); } .val { font-size: 12px; font-weight: 800; color: #fff; } .progress-track { height: 8px; background: hsla(255,255%,255%,0.05); border-radius: 4px; overflow: hidden; .progress-fill { height: 100%; border-radius: inherit; box-shadow: 0 0 8px currentColor; } } }

    .no-data-msg { text-align: center; padding: 48px 20px; color: var(--text-muted); font-size: 13px; }

    .rev-bars { display: flex; align-items: flex-end; gap: 8px; height: 160px; padding-top: 20px; overflow-x: auto; }
    .rev-bar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 40px; height: 100%; justify-content: flex-end; }
    .rev-bar { width: 100%; background: linear-gradient(180deg, var(--primary), var(--accent)); border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s ease; box-shadow: 0 0 8px var(--primary-glow); }
    .rev-day { font-size: 9px; color: var(--text-muted); font-weight: 700; text-align: center; white-space: nowrap; }

    @media (max-width: 1024px) { .analytics-grid { grid-template-columns: 1fr; } }
  `]
})
export class AnalyticsComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private lotService = inject(ParkingLotService);

  lots = signal<ParkingLot[]>([]);
  selectedLotId: number | null = null;
  lotStats = signal<{ occupancy: number; revenue: number; avgDuration: number } | null>(null);
  peakHours = signal<number[]>([]);
  occupancyHours = signal<number[]>(Array(12).fill(0));
  spotTypes = signal<{ type: string; count: number; percent: number; color: string }[]>([]);
  revenueByDay = signal<{ date: string; amount: number; pct: number }[]>([]);

  hourLabels = ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

  cards = signal([
    { label: 'Total Lots', value: '0', iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { label: 'Total Revenue', value: '$0', iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { label: 'Occupancy Rate', value: '0%', iconPath: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z' },
    { label: 'Active Sessions', value: '0', iconPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
  ]);

  ngOnInit(): void {
    this.lotService.getAll().subscribe(lots => this.lots.set(lots));
    this.analytics.getPlatformSummary().subscribe({
      next: (summary) => {
        this.cards.set([
          { label: 'Total Lots', value: summary.activeLots.toString(), iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
          { label: 'Total Revenue', value: '$' + summary.dailyRevenue.toLocaleString(), iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
          { label: 'Occupancy Rate', value: Math.round(summary.platformOccupancyRate) + '%', iconPath: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z' },
          { label: 'Active Sessions', value: (summary.totalSpots - summary.availableSpots).toString(), iconPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
        ]);
      },
      error: () => {}
    });
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

        // Occupancy by hour — sample every 2 hours (0-22)
        const hours = Array.from({ length: 12 }, (_, i) => byHour?.[i * 2] ?? 0);
        this.occupancyHours.set(hours);

        // Spot types
        const colors = ['var(--primary)', 'var(--accent)', '#10b981', '#f59e0b', '#00d4ff'];
        const total = Object.values(spotTypes ?? {}).reduce((a, b) => a + b, 0) || 1;
        this.spotTypes.set(Object.entries(spotTypes ?? {}).map(([type, count], i) => ({
          type, count: count as number, percent: Math.round((count as number) / total * 100), color: colors[i % colors.length]
        })));

        // Revenue by day
        const revEntries = Object.entries(revByDay ?? {}).slice(-14);
        const maxRev = Math.max(...revEntries.map(([, v]) => v as number), 1);
        this.revenueByDay.set(revEntries.map(([date, amount]) => ({
          date, amount: amount as number, pct: Math.round((amount as number) / maxRev * 100)
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

  // Build SVG path from occupancy hour data
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
    if (!pts.length) return '';
    return pts.reduce((acc, pt, i) => acc + (i === 0 ? `M${pt.x},${pt.y}` : ` L${pt.x},${pt.y}`), '');
  }

  occupancyAreaPath(): string {
    const line = this.occupancyLinePath();
    if (!line) return '';
    const pts = this.chartPoints();
    return line + ` L${pts[pts.length - 1].x},240 L${pts[0].x},240 Z`;
  }
}
