import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ParkingLotService } from '../../core/services/parking-lot.service';
import { ParkingSpotService } from '../../core/services/parking-spot.service';
import { ReservationService, Reservation } from '../../core/services/reservation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-hero animate-in">
      <div class="hero-content">
        <span class="badge badge-info mb-4">Systems Operational</span>
        <h1>Command Center <span class="accent-text">Core</span></h1>
        <p>Orchestrating real-time parking logistics and revenue velocity across your global network.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" routerLink="/reservations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Rapid Booking
          </a>
          <button class="btn btn-secondary">System Audit</button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="mini-stat">
          <span class="label">Network Uptime</span>
          <span class="value">99.98%</span>
        </div>
        <div class="mini-stat">
          <span class="label">Latency</span>
          <span class="value">24ms</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 mb-8">
      <article class="stat-card" *ngFor="let stat of stats()">
        <div class="icon-wrap" [style.background]="stat.color + '20'" [style.color]="stat.color">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path [attr.d]="stat.icon"></path>
          </svg>
        </div>
        <div class="content">
          <span class="label">{{ stat.label }}</span>
          <div class="value-row">
            <span class="value">{{ stat.value }}</span>
            <span class="trend" [class.up]="stat.trend > 0">{{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%</span>
          </div>
        </div>
      </article>
    </div>

    <div class="grid grid-cols-3 mb-8">
      <section class="card col-span-2 chart-box">
        <div class="card-header">
          <div>
            <h3>Revenue Velocity</h3>
            <p>Earnings trajectory for the current cycle</p>
          </div>
          <select class="glass-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        
        <div class="chart-wrapper">
          <svg viewBox="0 0 800 250" class="main-chart">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"></stop>
                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"></stop>
              </linearGradient>
            </defs>
            <path class="area" d="M0 250 Q 100 180, 200 210 T 400 130 T 600 160 T 800 80 L 800 250 L 0 250 Z" fill="url(#chartFill)"></path>
            <path class="line" d="M0 250 Q 100 180, 200 210 T 400 130 T 600 160 T 800 80" fill="none" stroke="var(--primary)" stroke-width="4"></path>
            <circle cx="400" cy="130" r="6" fill="var(--bg-base)" stroke="var(--primary)" stroke-width="3"></circle>
            <circle cx="800" cy="80" r="6" fill="var(--bg-base)" stroke="var(--primary)" stroke-width="3"></circle>
          </svg>
        </div>
      </section>

      <section class="card occupancy-widget">
        <div class="card-header">
          <h3>Utilization</h3>
          <span class="badge badge-success">Live</span>
        </div>
        
        <div class="gauge-box">
          <svg viewBox="0 0 200 200" class="gauge">
            <circle cx="100" cy="100" r="80" class="track"></circle>
            <circle cx="100" cy="100" r="80" class="fill" 
                    [attr.stroke-dasharray]="occupancyCircumference" 
                    [attr.stroke-dashoffset]="occupancyOffset()"></circle>
            <text x="100" y="105" class="percentage">{{ occupancy() }}%</text>
          </svg>
        </div>

        <div class="level-list">
          <div class="level-item" *ngFor="let level of levels">
            <span class="name">{{ level.name }}</span>
            <div class="progress">
              <div class="bar" [style.width.%]="level.value"></div>
            </div>
            <span class="val">{{ level.value }}%</span>
          </div>
        </div>
      </section>
    </div>

    <section class="table-container">
      <div class="card-header p-6">
        <div>
          <h3>System Activity</h3>
          <p>Recent synchronization events and transactions</p>
        </div>
        <button class="btn btn-secondary btn-sm">Full Logs</button>
      </div>
      <table class="pe-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let res of recentReservations()">
            <td class="font-heading">#{{ res.bookingId || 'N/A' }}</td>
            <td>
              <div class="flex items-center gap-2">
                <div class="badge badge-info">{{ res.spotNumber || 'A1' }}</div>
                <span>{{ res.vehiclePlate || 'PKE-1024' }}</span>
              </div>
            </td>
            <td><span class="badge" [class.badge-success]="res.status === 'ACTIVE' || res.status === 'RESERVED'">{{ res.status }}</span></td>
            <td class="text-muted">{{ res.startTime | date:'MMM d, h:mm a' }}</td>
            <td class="font-heading">{{ res.totalAmount | currency }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="recentReservations().length === 0" class="empty-state p-12">
        <p>No transactions detected in the current cycle.</p>
      </div>
    </section>
  `,
  styles: [`
    .dashboard-hero {
      background: linear-gradient(135deg, hsla(var(--p-primary), 0.15) 0%, transparent 60%);
      border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: 48px; display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 40px; position: relative; overflow: hidden;
      &::after { content: ''; position: absolute; top: -50%; right: -10%; width: 500px; height: 500px; background: radial-gradient(circle, hsla(var(--p-primary), 0.1) 0%, transparent 70%); z-index: 0; }
    }

    .hero-content {
      position: relative; z-index: 1; max-width: 600px;
      h1 { font-size: 3.5rem; line-height: 1; margin-bottom: 16px; }
      .accent-text { color: var(--primary); }
      p { font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 32px; }
    }

    .hero-actions { display: flex; gap: 16px; }

    .hero-stats {
      display: flex; gap: 40px;
      .mini-stat {
        display: flex; flex-direction: column;
        .label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .value { font-family: 'Outfit'; font-size: 2rem; font-weight: 800; color: #fff; }
      }
    }

    .stat-card {
      background: hsla(222, 47%, 10%, 0.4);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      transition: var(--trans);
      display: flex; align-items: center; gap: 20px;
      .icon-wrap { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; svg { width: 28px; height: 28px; } }
      .content {
        flex: 1;
        .label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .value-row {
          display: flex; align-items: baseline; justify-content: space-between;
          .value { font-family: 'Outfit'; font-size: 1.75rem; font-weight: 800; }
          .trend { font-size: 12px; font-weight: 800; &.up { color: #10b981; } &:not(.up) { color: #ef4444; } }
        }
      }
    }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }

    .chart-box {
      .chart-wrapper { height: 250px; width: 100%; position: relative; margin-top: 20px; }
      .main-chart { width: 100%; height: 100%; overflow: visible; }
    }

    .occupancy-widget {
      display: flex; flex-direction: column; align-items: center;
      .gauge-box { position: relative; width: 200px; height: 200px; margin-bottom: 24px; }
      .gauge {
        width: 100%; height: 100%; transform: rotate(-90deg);
        .track { fill: none; stroke: hsla(255, 255%, 255%, 0.05); stroke-width: 16; }
        .fill { fill: none; stroke: var(--primary); stroke-width: 16; stroke-linecap: round; filter: drop-shadow(0 0 8px var(--primary-glow)); transition: var(--trans); }
        .percentage { transform: rotate(90deg); transform-origin: center; font-family: 'Outfit'; font-size: 32px; font-weight: 800; fill: #fff; text-anchor: middle; }
      }
    }

    .level-list {
      width: 100%; display: flex; flex-direction: column; gap: 12px;
      .level-item {
        display: flex; align-items: center; gap: 12px;
        .name { font-size: 12px; font-weight: 800; color: var(--text-muted); width: 24px; }
        .progress { flex: 1; height: 6px; background: hsla(255, 255%, 255%, 0.05); border-radius: 10px; overflow: hidden; .bar { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: inherit; } }
        .val { font-size: 12px; font-weight: 800; color: var(--text-secondary); width: 32px; }
      }
    }

    .glass-select {
      background: var(--bg-elevated); border: 1px solid var(--border); color: #fff;
      padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
    }

    .col-span-2 { grid-column: span 2; }
    .p-6 { padding: 24px; }
    .p-12 { padding: 48px; }
  `]
})
export class DashboardComponent implements OnInit {
  private lotService = inject(ParkingLotService);
  private resService = inject(ReservationService);
  private spotService = inject(ParkingSpotService);

  readonly occupancyCircumference = 2 * Math.PI * 80;
  Math = Math;

  stats = signal([
    { label: 'Active Network', value: '0', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5', color: '#4f8ef7', trend: 12 },
    { label: 'Spot Capacity', value: '0', icon: 'M4 7V4a2 2 0 012-2h12a2 2 0 012 2v3M4 17v3a2 2 0 012 2h12a2 2 0 012-2v-3M9 12h6', color: '#10b981', trend: 5 },
    { label: 'Global Bookings', value: '0', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#f59e0b', trend: -2 },
    { label: 'Total Revenue', value: '$0', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.646 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.646-1M12 16a3.332 3.332 0 01-2.646-1m5.292 0a3.332 3.332 0 00-2.646 1', color: '#00d4ff', trend: 18 }
  ]);

  levels = [
    { name: 'L1', value: 72 },
    { name: 'L2', value: 58 },
    { name: 'L3', value: 81 },
    { name: 'EV', value: 46 }
  ];

  recentReservations = signal<Reservation[]>([]);
  occupancy = signal(65);

  ngOnInit() {
    this.loadData();
  }

  occupancyOffset(): number {
    return this.occupancyCircumference - (this.occupancy() / 100) * this.occupancyCircumference;
  }

  loadData() {
    forkJoin({
      lots: this.lotService.getAll(),
      res: this.resService.getAll(),
      spots: this.spotService.getAvailable()
    }).subscribe({
      next: ({ lots, res, spots }) => {
        this.stats.update(s => [
          { ...s[0], value: lots.length.toString() },
          { ...s[1], value: (lots.reduce((a,l) => a+l.totalSpots,0) - spots.length).toString() },
          { ...s[2], value: res.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED').length.toString() },
          { ...s[3], value: '$' + res.reduce((acc, r) => acc + (r.totalAmount || 0), 0).toFixed(0) }
        ]);
        this.recentReservations.set(res.slice(0, 5));

        const total = lots.reduce((acc, l) => acc + l.totalSpots, 0);
        const avail = spots.length;
        if (total > 0) this.occupancy.set(Math.round(((total - avail) / total) * 100));
      },
      error: () => undefined
    });
  }
}
