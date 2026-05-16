import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { forkJoin, of, interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ParkingSpotService, ParkingSpot } from '../../core/services/parking-spot.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ReservationService, Reservation } from '../../core/services/reservation.service';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { ParkingLotService, ParkingLot } from '../../core/services/parking-lot.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="zenith-container animate-in">
      <header class="zenith-header">
        <div class="header-content" *ngIf="isManagerOrAdmin; else driverProfile">
          <span class="system-time">{{ currentTime | date:'HH:mm:ss' }}</span>
          <h1 class="zenith-title">
            Operational 
            <span class="gradient-text">Portal</span>
          </h1>
        </div>
        <ng-template #driverProfile>
          <div class="driver-profile-header">
            <div class="profile-main">
              <div class="avatar-container clickable-avatar" routerLink="/profile">
                <img [src]="user()?.profilePicture || 'https://ui-avatars.com/api/?name=' + (user()?.fullName || 'User') + '&background=6366f1&color=fff&length=1&rounded=true'" class="avatar-img" alt="Profile">
                <div class="status-dot"></div>
              </div>
              <div class="profile-info">
                <span class="welcome-tag">Welcome back,</span>
                <h1 class="driver-name">{{ user()?.fullName || 'ParkEase Driver' }}</h1>
                <div class="session-meta">
                  <span class="time-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4 M8 2v4 M3 10h18"/></svg>
                    {{ currentTime | date:'EEEE, MMM d • HH:mm:ss' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ng-template>

        <div class="header-actions">
          <button class="zenith-btn" *ngIf="!isManagerOrAdmin" routerLink="/reservations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
            Book Spot
          </button>
          <button class="zenith-btn primary" *ngIf="isManagerOrAdmin">System Sync</button>
        </div>
      </header>

      <!-- Overdue Warning Banner (Driver Only) -->
      <div class="overdue-banner animate-in" *ngIf="!isManagerOrAdmin && isOverdue() && activeSession()">
        <div class="alert-content">
          <div class="alert-icon pulse-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
          </div>
          <div class="alert-text">
            <h4>URGENT: PARKING SESSION OVERDUE</h4>
            <p>Your session ended at {{ activeSession()?.endTime | date:'h:mm a' }}. Please vacate the spot or extend your booking immediately.</p>
          </div>
          <button class="zenith-btn danger sm" routerLink="/reservations">Extend Now</button>
        </div>
      </div>

      <!-- MANAGER / ADMIN VIEW -->
      <div class="bento-grid" *ngIf="isManagerOrAdmin">
        <!-- Main Utility Gauge (2x2) -->
        <section class="bento-card large glass util-tile-new">
          <div class="tile-header-new">
            <div class="icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/><line x1="8" y1="12" x2="8" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="16" y1="14" x2="16" y2="16"/></svg>
            </div>
            <span class="tile-label">Global Utilization</span>
          </div>
          <div class="gauge-focus-new">
            <div class="arc-visual-new">
              <svg viewBox="0 0 120 120" class="circular-arc">
                <!-- Circumference for r=50 is 314.16. Gap is 70, track is 244.16 -->
                <circle class="track" cx="60" cy="60" r="50" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="244.16 70"></circle>
                <circle class="fill" cx="60" cy="60" r="50" fill="none" stroke-width="8" stroke-linecap="round" 
                        [style.stroke-dashoffset]="circularOffset()" stroke-dasharray="244.16 314.16"></circle>
              </svg>
              <div class="arc-text-new">
                <span class="lab">GLOBAL UTILIZATION</span>
                <span class="val">{{ occupancy() | number:'1.0-0' }}%</span>
              </div>
            </div>
            <div class="metric-pill-new">
              {{ getOccupiedSpots() }} / {{ stats()[1].value }} SPOTS
            </div>
          </div>
        </section>

        <!-- Revenue Pulse (2x1) -->
        <section class="bento-card wide glass revenue-tile-new">
          <div class="tile-header-new">
            <span class="tile-label">REVENUE VELOCITY (7 DAYS)</span>
            <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H9M17 7V15"/></svg>
          </div>
          <div class="pulse-value-new">{{ stats()[3].value }}</div>
        </section>

        <!-- Recent Activity Feed (2x1) -->
        <section class="bento-card wide glass activity-tile">
          <div class="tile-header">
            <div class="header-title">
              <span class="tile-label">Global Transitions</span>
              <span class="live-pulse"></span>
            </div>
            <button class="text-btn" routerLink="/reservations">View All Intelligence</button>
          </div>
          <div class="activity-feed">
            <div class="feed-header">
              <span>IDENTIFIER</span>
              <span>ENTITY</span>
              <span>STATUS</span>
              <span>TIMESTAMP</span>
            </div>
            <div class="activity-item animate-in" *ngFor="let res of recentReservations().slice(0,4)" (click)="viewDetails(res.bookingId)">
              <div class="item-id">#{{ res.bookingId.toString().substring(0,8) }}</div>
              <div class="item-info">
                <span class="spot">Spot {{ res.spotNumber }}</span>
                <span class="plate">{{ res.vehiclePlate }}</span>
              </div>
              <div class="item-status-box">
                <span class="status-dot" [attr.data-status]="res.status"></span>
                <span class="status-label">{{ res.status }}</span>
              </div>
              <div class="item-time">
                <span class="date">{{ res.startTime | date:'MMM d' }}</span>
                <span class="clock">{{ res.startTime | date:'HH:mm' }}</span>
              </div>
            </div>
            <div *ngIf="recentReservations().length === 0" class="empty-list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
              No recent global activity detected.
            </div>
          </div>
        </section>

        <!-- Live Telemetry Stream (4x1) -->
        <section class="bento-card glass telemetry-tile" style="grid-column: span 4;">
          <div class="telemetry-layout">
            <div class="telemetry-left">
              <div class="tile-header">
                <div class="header-title">
                  <span class="tile-label">Live Telemetry Stream</span>
                  <span class="live-pulse"></span>
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
            <div class="telemetry-right">
              <div class="tile-header">
                <span class="tile-label">System Telemetry & Metrics</span>
              </div>
              <div class="telemetry-stats-grid">
                <div class="telemetry-stat-card">
                  <span class="stat-label">Active Alerts</span>
                  <span class="stat-value text-red">{{ isOverdue() ? '1' : '0' }}</span>
                </div>
                <div class="telemetry-stat-card">
                  <span class="stat-label">Bays Occupied</span>
                  <span class="stat-value">{{ getOccupiedSpots() }}</span>
                </div>
                <div class="telemetry-stat-card">
                  <span class="stat-label">Available Bays</span>
                  <span class="stat-value text-green">{{ (parseNumber(stats()[1].value) - getOccupiedSpots()) || 0 }}</span>
                </div>
                <div class="telemetry-stat-card">
                  <span class="stat-label">Occupancy Rate</span>
                  <span class="stat-value text-primary">{{ occupancy() | number:'1.0-0' }}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Infrastructure Health Grid (4x1) -->
        <section class="bento-card glass health-tile" style="grid-column: span 4;" *ngIf="lots().length > 0">
          <div class="tile-header" style="margin-bottom: 20px;">
            <span class="tile-label">Network Infrastructure Health</span>
            <button class="zenith-btn primary btn-xs" style="padding: 6px 12px; font-size: 10px;">Audit Report</button>
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
        </section>
      </div>

      <!-- DRIVER VIEW -->
      <div class="bento-grid" *ngIf="!isManagerOrAdmin">
        <!-- Active Session Card (2x2) -->
        <section class="bento-card large glass session-tile">
          <div class="tile-header">
            <div class="header-left-group">
              <span class="tile-label">Active Session</span>
              <div class="driver-badge clickable-badge" routerLink="/profile">
                <img [src]="user()?.profilePicture || 'https://ui-avatars.com/api/?name=' + (user()?.fullName || 'User') + '&background=6366f1&color=fff&length=1&rounded=true'" alt="Driver">
                <span class="badge-name">{{ user()?.fullName }}</span>
              </div>
            </div>
            <span class="live-indicator" *ngIf="activeSession()">
              {{ activeSession()?.status === 'ACTIVE' ? 'SESSION ACTIVE' : 'RESERVATION CONFIRMED' }}
            </span>
          </div>

          <div class="status-indicator-bar" *ngIf="activeSession()" [class.active]="activeSession()?.status === 'ACTIVE'">
            <div class="indicator-glow"></div>
            <span class="status-label">
              {{ activeSession()?.status === 'ACTIVE' ? '✓ PROPERLY CHECKED IN' : '⌛ ARRIVAL PENDING' }}
            </span>
            <span class="status-detail" *ngIf="activeSession()?.status === 'ACTIVE'">
              Authenticated at {{ activeSession()?.startTime | date:'h:mm a' }}
            </span>
          </div>
          
          <div class="session-focus" *ngIf="activeSession(); else noSession">
            <div class="session-timer" [class.overdue]="isOverdue()">
              <span class="time-val">{{ timerValue() }}</span>
              <span class="time-lab">{{ timerLabel() }} (HH:MM)</span>
            </div>
            <div class="session-info">
              <div class="info-row">
                <span class="lab">Spot</span>
                <span class="val">{{ activeSession()?.spotNumber || 'TBD' }}</span>
              </div>
              <div class="info-row">
                <span class="lab">Check-in</span>
                <span class="val">{{ activeSession()?.startTime | date:'MMM d, HH:mm' }}</span>
              </div>
              <div class="info-row">
                <span class="lab">Check-out</span>
                <span class="val">{{ activeSession()?.endTime | date:'MMM d, HH:mm' }}</span>
              </div>
              <div class="info-row">
                <span class="lab">Vessel</span>
                <span class="val">{{ activeSession()?.vehiclePlate }}</span>
              </div>
            </div>
          </div>
          <ng-template #noSession>
            <div class="empty-focus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21a8 8 0 100-16 8 8 0 000 16z M12 8v4l3 3"/></svg>
              <p>No active session found</p>
              <button class="zenith-btn primary mt-4" routerLink="/reservations">Reserve Now</button>
            </div>
          </ng-template>
        </section>

        <!-- My Fleet (2x1) -->
        <section class="bento-card wide glass fleet-tile">
          <div class="tile-header">
            <span class="tile-label">Your Fleet</span>
            <button class="text-btn" routerLink="/vehicles">Manage</button>
          </div>
          <div class="fleet-row">
            <div class="vehicle-pill" *ngFor="let v of myVehicles().slice(0,3)">
              <span class="plate">{{ v.licensePlate }}</span>
              <span class="type">{{ v.vehicleType }}</span>
            </div>
            <div *ngIf="myVehicles().length === 0" class="empty-note">No vessels registered.</div>
          </div>
        </section>

        <!-- Recent Activity Feed (2x1) -->
        <section class="bento-card wide glass activity-tile">
          <div class="tile-header">
             <div class="header-title">
              <span class="tile-label">Recent Bookings</span>
              <span class="live-pulse"></span>
            </div>
            <button class="text-btn" routerLink="/reservations">History</button>
          </div>
          <div class="activity-feed">
             <div class="feed-header">
              <span>IDENTIFIER</span>
              <span>ZONE</span>
              <span>STATUS</span>
              <span>DATE</span>
            </div>
            <div class="activity-item animate-in" *ngFor="let res of recentReservations().slice(0,4)" (click)="viewDetails(res.bookingId)">
              <div class="item-id">#{{ res.bookingId.toString().substring(0,8) }}</div>
              <div class="item-info">
                <span class="spot">Bay {{ res.spotNumber }}</span>
                <span class="cost">{{ res.totalAmount | currency }}</span>
              </div>
              <div class="item-status-box">
                <span class="status-dot" [attr.data-status]="res.status"></span>
                <span class="status-label">{{ res.status }}</span>
              </div>
              <div class="item-time">{{ res.startTime | date:'MMM d, h:mm a' }}</div>
            </div>
            <div *ngIf="recentReservations().length === 0" class="empty-list">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
               No recent bookings found.
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .zenith-container { display: flex; flex-direction: column; gap: 32px; padding: 32px; color: var(--text-primary); min-height: 100vh; background: oklch(var(--background)); }

    /* Header */
    .zenith-header {
      display: flex; justify-content: space-between; align-items: center;
      .system-time { font-family: monospace; font-size: 12px; color: var(--primary-color); letter-spacing: 2px; }
      .zenith-title { font-size: 42px; font-weight: 800; letter-spacing: -1px; margin-top: 4px; color: var(--text-primary); }
    }

    .driver-profile-header {
      .profile-main { display: flex; align-items: center; gap: 16px; }
      .avatar-container {
        position: relative; cursor: pointer; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        &:hover { transform: scale(1.1) rotate(5deg); .avatar-img { border-color: var(--primary-glow); box-shadow: 0 0 20px var(--primary-glow); } }
        .avatar-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color); padding: 1px; transition: 0.3s; }
        .status-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #10b981; border: 2px solid oklch(var(--background)); border-radius: 50%; }
      }
      .profile-info {
        display: flex; flex-direction: column;
        .welcome-tag { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        .driver-name { font-size: 32px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; margin: 0; }
        .time-pill { 
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; color: var(--primary-color); background: oklch(var(--primary-glow) / 10%); padding: 4px 12px; border-radius: 100px; width: fit-content; margin-top: 4px; 
          svg { width: 14px; height: 14px; }
        }
      }
    }
    .header-actions { display: flex; gap: 12px; }
    .zenith-btn {
      padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border-color);
      background: var(--bg-card); color: var(--text-primary); font-weight: 700; cursor: pointer; transition: 0.3s;
      display: flex; align-items: center; gap: 8px;
      svg { width: 18px; height: 18px; }
      &.primary { background: var(--primary-color); color: var(--primary-fg); border: none; }
      &:hover { transform: translateY(-2px); background: var(--bg-hover); }
    }

    .text-btn {
      background: oklch(var(--primary-glow) / 8%);
      color: var(--primary-color);
      border: 1px solid oklch(var(--primary-glow) / 15%);
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      &:hover { background: var(--primary-color); color: white; transform: translateY(-1px); border-color: var(--primary-color); box-shadow: 0 4px 12px oklch(var(--primary) / 20%); }
    }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: minmax(200px, auto);
      gap: 24px;
    }
    .bento-card {
      padding: 24px; border-radius: 32px; display: flex; flex-direction: column; gap: 16px;
      overflow: hidden;
      &.large { grid-column: span 2; grid-row: span 2; }
      &.wide { grid-column: span 2; }
    }

    .tile-header {
      display: flex; justify-content: space-between; align-items: center;
      .header-left-group { display: flex; align-items: center; gap: 16px; }
      .tile-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
      .live-indicator { font-size: 10px; font-weight: 900; color: #10b981; display: flex; align-items: center; gap: 4px; &::before { content: ''; width: 6px; height: 6px; background: currentColor; border-radius: 50%; animation: pulse 2s infinite; } }
      .tile-icon { width: 20px; height: 20px; color: var(--primary-color); }
    }

    /* Manager/Admin Visuals - New Redesign */
    .util-tile-new {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-color) !important;
      backdrop-filter: blur(20px);
      align-items: center; justify-content: center;
      .tile-header-new {
        display: flex; align-items: center; gap: 12px; width: 100%; justify-content: flex-start;
        .icon-box { 
          width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.05); 
          display: flex; align-items: center; justify-content: center; color: #10b981;
          svg { width: 16px; height: 16px; }
        }
        .tile-label { font-size: 16px; font-weight: 700; color: var(--text-primary); letter-spacing: 0px; text-transform: none; }
      }
      .gauge-focus-new { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; margin-top: 10px; }
      .arc-visual-new {
        position: relative; width: 220px; height: 220px;
        .circular-arc {
          width: 100%; height: 100%;
          .track { stroke: oklch(var(--foreground) / 8%); transform: rotate(130deg); transform-origin: center; }
          .fill { 
            stroke: #10b981;
            transform: rotate(130deg); transform-origin: center;
            transition: stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        }
        .arc-text-new {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%;
          .lab { font-size: 11px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; margin-top: 16px; }
          .val { font-size: 54px; font-weight: 800; color: var(--text-primary); letter-spacing: -2px; line-height: 1; margin-top: 4px; }
        }
      }
      .metric-pill-new {
        padding: 8px 20px; border-radius: 100px; border: 1px solid var(--border-color);
        font-size: 11px; font-weight: 800; color: var(--text-secondary); letter-spacing: 1px; background: oklch(var(--foreground) / 2%);
        margin-top: -24px; z-index: 10;
      }
    }

    .revenue-tile-new {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-color) !important;
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; justify-content: flex-start;
      .tile-header-new {
        display: flex; justify-content: space-between; align-items: center;
        .tile-label { font-size: 10px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; }
        .trend-icon { width: 16px; height: 16px; color: #a78bfa; }
      }
      .pulse-value-new {
        font-size: 32px; font-weight: 600; color: var(--text-primary); margin-top: 16px; letter-spacing: -1px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
    }

    /* Driver Visuals */
    .session-tile {
      .session-focus { flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 32px; padding-left: 4px; }
      .session-timer { 
        display: flex; flex-direction: column; align-items: flex-start;
        .time-val { font-size: 72px; font-weight: 900; letter-spacing: -3px; color: var(--primary-color); line-height: 1; transition: color 0.3s; }
        .time-lab { font-size: 11px; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; margin-top: 8px; transition: color 0.3s; }
        
        &.overdue {
          .time-val { color: #ef4444; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.3)); }
          .time-lab { color: #ef4444; opacity: 0.8; }
        }
      }
      .driver-badge {
        display: flex; align-items: center; gap: 8px; padding: 4px 10px; background: oklch(var(--primary-glow) / 8%); border-radius: 100px;
        cursor: pointer; transition: 0.3s;
        &:hover { background: oklch(var(--primary-glow) / 15%); transform: translateY(-2px); }
        img { width: 18px; height: 18px; border-radius: 50%; }
        .badge-name { font-size: 11px; font-weight: 800; color: var(--text-primary); }
      }
      .session-info { 
        display: grid; grid-template-columns: 1fr 1fr; gap: 24px 64px; width: 100%;
        .info-row { display: flex; flex-direction: column; .lab { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; } .val { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-top: 4px; } } 
      }
      .empty-focus { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); svg { width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.2; } p { font-weight: 600; } }
    }

    .fleet-tile {
      .fleet-row { display: flex; gap: 12px; }
      .vehicle-pill { 
        padding: 12px 20px; background: var(--bg-hover); border-radius: 16px; border: 1px solid var(--border-color);
        display: flex; flex-direction: column; gap: 4px;
        .plate { font-size: 14px; font-weight: 800; }
        .type { font-size: 10px; font-weight: 700; color: var(--primary-color); text-transform: uppercase; }
      }
    }

    .empty-list { 
      font-size: 13px; color: var(--text-muted); padding: 32px; text-align: center; 
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      svg { width: 32px; height: 32px; opacity: 0.2; }
    }

    .activity-feed { 
      display: flex; flex-direction: column; gap: 8px; margin-top: 8px; 
      .feed-header {
        display: grid; grid-template-columns: 80px 1fr 120px 100px; padding: 0 16px;
        font-size: 10px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px;
      }
    }
    .activity-item {
      display: grid; grid-template-columns: 80px 1fr 120px 100px; align-items: center; padding: 16px;
      background: var(--bg-hover); border-radius: 20px; border: 1px solid var(--border-color);
      cursor: pointer; transition: 0.3s;
      &:hover { border-color: var(--primary-color); transform: translateX(4px); background: oklch(var(--primary) / 2%); }
      
      .item-id { font-size: 11px; font-weight: 800; color: var(--primary-color); font-family: monospace; }
      .item-info { display: flex; flex-direction: column; .spot { font-size: 14px; font-weight: 800; } .plate, .cost { font-size: 11px; color: var(--text-muted); } }
      .item-status-box { 
        display: flex; align-items: center; gap: 8px;
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
        .status-dot[data-status="ACTIVE"] { background: #10b981; box-shadow: 0 0 12px rgba(16, 185, 129, 0.4); }
        .status-dot[data-status="RESERVED"] { background: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); }
        .status-dot[data-status="COMPLETED"] { background: #6366f1; box-shadow: 0 0 12px rgba(99, 102, 241, 0.4); }
        .status-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: oklch(var(--foreground) / 3%); }
      }
      .item-time { 
        display: flex; flex-direction: column; text-align: right;
        .date { font-size: 12px; font-weight: 700; }
        .clock { font-size: 10px; color: var(--text-muted); }
      }
    }

    .header-title { display: flex; align-items: center; gap: 10px; }

    .live-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: live-pulse 2s infinite; }
    @keyframes live-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    /* Enhanced Feedback Styles */
    .overdue-banner {
      background: oklch(0.5 0.2 20 / 15%); border: 2px solid #ef4444; border-radius: 24px; margin-bottom: 32px;
      padding: 24px; backdrop-filter: blur(12px);
      .alert-content { display: flex; align-items: center; gap: 24px; }
      .alert-icon { 
        width: 48px; height: 48px; border-radius: 12px; background: #ef4444; color: white;
        display: flex; align-items: center; justify-content: center;
        svg { width: 24px; height: 24px; }
      }
      .alert-text {
        flex: 1;
        h4 { margin: 0; font-size: 18px; font-weight: 800; color: #ef4444; letter-spacing: 0.5px; }
        p { margin: 4px 0 0 0; font-size: 14px; color: var(--text-muted); font-weight: 500; }
      }
      .zenith-btn.danger { background: #ef4444; color: white; border: none; font-size: 12px; padding: 10px 20px; }
    }

    .status-indicator-bar {
      display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 16px; 
      background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 8px;
      position: relative; overflow: hidden;
      
      .indicator-glow { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #f59e0b; }
      .status-label { font-size: 11px; font-weight: 800; color: #f59e0b; letter-spacing: 0.5px; }
      .status-detail { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-left: auto; }

      &.active {
        background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2);
        .indicator-glow { background: #10b981; }
        .status-label { color: #10b981; }
      }
    }

    .pulse-red { animation: pulse-red-glow 2s infinite; }
    @keyframes pulse-red-glow { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } }
    .telemetry-layout {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 40px;
      width: 100%;
    }
    @media (max-width: 992px) {
      .telemetry-layout { grid-template-columns: 1fr; gap: 24px; }
    }
    .telemetry-left, .telemetry-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .telemetry-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      flex: 1;
      align-content: center;
    }
    .telemetry-stat-card {
      background: oklch(var(--foreground) / 2%);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: 0.3s;
      &:hover {
        background: oklch(var(--foreground) / 4%);
        transform: translateY(-2px);
      }
      .stat-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
      }
      .text-red { color: #ef4444 !important; }
      .text-green { color: #10b981 !important; }
      .text-primary { color: var(--primary-color) !important; }
    }

    .telemetry-feed { display: flex; flex-direction: column; gap: 12px; max-height: 200px; overflow-y: auto; padding-right: 8px; }
    .telemetry-item { 
      display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; background: oklch(var(--foreground) / 3%); border: 1px solid transparent; transition: 0.3s;
      &.new { background: oklch(var(--foreground) / 6%); border-color: oklch(var(--foreground) / 10%); animation: entry-glow 2s infinite; }
      .event-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; svg { width: 16px; height: 16px; } }
      .event-info { flex: 1; display: flex; flex-direction: column; .event-title { font-size: 13px; font-weight: 800; color: var(--text-primary); } .event-meta { font-size: 10px; color: var(--text-muted); font-weight: 600; } }
      .event-status { font-size: 9px; font-weight: 900; letter-spacing: 1px; }
    }
    @keyframes entry-glow { 0% { box-shadow: 0 0 0 0 oklch(var(--foreground) / 10%); } 70% { box-shadow: 0 0 0 10px oklch(var(--foreground) / 0%); } 100% { box-shadow: 0 0 0 0 oklch(var(--foreground) / 0%); } }

    .health-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .health-card { 
      padding: 20px; border-radius: 20px; background: oklch(var(--foreground) / 3%); border: 1px solid oklch(var(--foreground) / 5%); transition: 0.3s;
      &:hover { transform: translateY(-4px); background: oklch(var(--foreground) / 5%); border-color: oklch(var(--foreground) / 10%); }
      .health-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; .id { font-size: 10px; font-weight: 900; color: var(--text-muted); } .indicator { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px currentColor; } }
      .health-main { margin-bottom: 20px; h4 { margin: 0; font-size: 15px; font-weight: 800; } p { margin: 4px 0 0; font-size: 11px; color: var(--text-muted); } }
      .health-stats { display: flex; gap: 20px; margin-bottom: 20px; .stat { display: flex; flex-direction: column; span { font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } strong { font-size: 12px; font-weight: 800; } } }
      .health-track { height: 6px; border-radius: 3px; background: oklch(var(--foreground) / 5%); overflow: hidden; .fill { height: 100%; border-radius: 3px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); } }
    }

    .telemetry-count { font-size: 10px; font-weight: 900; color: var(--primary-color); background: oklch(var(--primary) / 10%); padding: 4px 10px; border-radius: 100px; }

  `]
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private resService = inject(ReservationService);
  private spotService = inject(ParkingSpotService);
  private vehicleService = inject(VehicleService);
  private lotService = inject(ParkingLotService);
  private destroyRef = inject(DestroyRef);

  user = signal(this.auth.currentUser);
  currentTime = new Date();
  
  get isManagerOrAdmin(): boolean {
    const role = this.auth.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  stats = signal([
    { label: 'Active Network', value: '0' },
    { label: 'Spot Capacity', value: '0' },
    { label: 'Global Bookings', value: '0' },
    { label: 'Total Revenue', value: '$0' }
  ]);

  recentReservations = signal<Reservation[]>([]);
  myVehicles = signal<any[]>([]);
  activeSession = signal<Reservation | null>(null);
  occupancy = signal(0);
  revenueHeights = signal<number[]>([5, 5, 5, 5, 5, 5, 5]);
  lots = signal<ParkingLot[]>([]);
  telemetryEvents = signal<{ title: string; subtitle: string; time: string; type: 'ENTRY' | 'EXIT'; isNew?: boolean }[]>([]);

  private mockEvents = [
    { title: 'Vessel ZN-402 Entered', subtitle: 'Sector Skylight • Bay 12', time: 'Just now', type: 'ENTRY', isNew: true },
    { title: 'Vessel ZN-109 Exited', subtitle: 'Sector LandRight • Bay 05', time: '2m ago', type: 'EXIT' },
    { title: 'Vessel ZN-882 Entered', subtitle: 'Sector LandArea • Bay 01', time: '12m ago', type: 'ENTRY' },
    { title: 'Vessel ZN-221 Exited', subtitle: 'Sector Skylight • Bay 18', time: '15m ago', type: 'EXIT' }
  ];

  ngOnInit() {
    this.loadData();
    setInterval(() => this.currentTime = new Date(), 1000);

    // Polling for real-time updates every 10 seconds
    interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  circularOffset(): number {
    const trackLength = 244.16;
    const val = this.occupancy();
    const progress = (val / 100) * trackLength;
    return trackLength - progress;
  }

  getOccupiedSpots(): number {
    const total = parseInt(this.stats()[1].value) || 0;
    return Math.round((this.occupancy() / 100) * total);
  }

  parseNumber(val: string): number {
    return parseInt(val) || 0;
  }

  isOverdue(): boolean {
    const session = this.activeSession();
    if (!session) return false;
    return new Date().getTime() > new Date(session.endTime).getTime();
  }

  timerValue(): string {
    const session = this.activeSession();
    if (!session) return '00:00';
    
    const now = new Date().getTime();
    const end = new Date(session.endTime).getTime();
    
    // Calculate difference (Remaining if now < end, Overdue if now > end)
    const diffMs = Math.abs(now - end);
    const diffMins = Math.floor(diffMs / 60000);
    
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }

  timerLabel(): string {
    return this.isOverdue() ? 'OVERDUE TIME' : 'TIME REMAINING';
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return 'Unknown';
    const now = new Date().getTime();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }

  generateTelemetryEvents(resList: Reservation[]) {
    const events: any[] = [];
    const now = new Date();

    resList.forEach(res => {
      // 1. Check-in event (ENTRY)
      if ((res.status === 'ACTIVE' || res.status === 'COMPLETED') && res.startTime) {
        const start = new Date(res.startTime);
        if (start <= now) {
          const diffMs = now.getTime() - start.getTime();
          events.push({
            title: `Vessel ${res.vehiclePlate || 'Unknown'} Entered`,
            subtitle: `Sector ${res.lotName || 'Zone ' + res.lotId} • Bay ${res.spotNumber || 'N/A'}`,
            timestamp: start.getTime(),
            time: this.formatTimeAgo(res.startTime),
            type: 'ENTRY',
            isNew: diffMs < 15000 // match slightly wider than our 10s poll window
          });
        }
      }

      // 2. Check-out event (EXIT)
      if (res.status === 'COMPLETED' && res.endTime) {
        const end = new Date(res.endTime);
        if (end <= now) {
          const diffMs = now.getTime() - end.getTime();
          events.push({
            title: `Vessel ${res.vehiclePlate || 'Unknown'} Exited`,
            subtitle: `Sector ${res.lotName || 'Zone ' + res.lotId} • Bay ${res.spotNumber || 'N/A'}`,
            timestamp: end.getTime(),
            time: this.formatTimeAgo(res.endTime),
            type: 'EXIT',
            isNew: diffMs < 15000
          });
        }
      }
    });

    if (events.length === 0) {
      this.telemetryEvents.set(this.mockEvents as any);
    } else {
      events.sort((a, b) => b.timestamp - a.timestamp);
      this.telemetryEvents.set(events.slice(0, 15));
    }
  }

  loadData() {
    if (this.isManagerOrAdmin) {
      forkJoin({
        summary: this.analyticsService.getPlatformSummary().pipe(catchError(() => of(null))),
        res: this.resService.getAll().pipe(catchError(() => of([]))),
        lots: this.lotService.getAll().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ summary, res, lots }) => {
          this.lots.set(lots);
          this.generateTelemetryEvents(res);
          if (summary) {
            this.stats.update(s => [
              { ...s[0], value: summary.activeLots.toString() },
              { ...s[1], value: summary.totalSpots.toString() },
              { ...s[2], value: res.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED').length.toString() },
              { ...s[3], value: '$' + summary.dailyRevenue.toFixed(0) }
            ]);
            this.occupancy.set(summary.platformOccupancyRate || 0);
          }
          // Sort: COMPLETED (Check-outs) first, then by Booking ID descending (Newest first)
          const sorted = [...res].sort((a, b) => {
            if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
            if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return 1;
            return b.bookingId - a.bookingId;
          });
          this.recentReservations.set(sorted);
          this.calculateRevenuePulse(res);
        }
      });
    } else {
      forkJoin({
        res: this.resService.getMyReservations().pipe(catchError(() => of([]))),
        vehicles: this.vehicleService.getMyVehicles().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ res, vehicles }) => {
          this.recentReservations.set(res.slice(0, 5));
          this.myVehicles.set(vehicles);
          
          // Detect active or imminent session
          const now = new Date();
          const candidates = res.filter(r => 
            (r.status === 'ACTIVE' || r.status === 'RESERVED') && 
            new Date(r.startTime) <= now
          );
          
          // Pick the session closest to "now"
          const active = candidates.length > 0 
            ? candidates.sort((a, b) => 
                Math.abs(now.getTime() - new Date(a.startTime).getTime()) - 
                Math.abs(now.getTime() - new Date(b.startTime).getTime())
              )[0]
            : null;
          
          this.activeSession.set(active);

          // Sort recent for driver: latest booking ID first
          const sorted = [...res].sort((a, b) => b.bookingId - a.bookingId);
          this.recentReservations.set(sorted);
        }
      });
    }
  }

  private calculateRevenuePulse(res: Reservation[]) {
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    res.forEach(r => {
      if (r.totalAmount && r.startTime) {
        const rDate = new Date(r.startTime);
        const diffDays = Math.floor(Math.abs(now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) dailyTotals[6 - diffDays] += r.totalAmount;
      }
    });
    const maxRev = Math.max(...dailyTotals, 1);
    this.revenueHeights.set(dailyTotals.map(t => Math.max((t / maxRev) * 100, 5)));
  }

  private router = inject(Router);
  viewDetails(id: number) {
    this.router.navigate(['/reservations', id]);
  }

  getLotOccupancyRate(lot: ParkingLot): number {
    if (!lot.totalSpots) return 0;
    return Math.round(((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100);
  }
}
