import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PlatformSummary {
  activeLots: number;
  totalSpots: number;
  availableSpots: number;
  platformOccupancyRate: number;
  dailyRevenue: number;
}

export interface DailyReport {
  lotId: number;
  date: string;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = inject(ApiService);

  // GET /analytics/platform-summary
  getPlatformSummary(): Observable<PlatformSummary> {
    return this.api.get<PlatformSummary>('analytics/platform-summary');
  }

  // GET /analytics/occupancy?lotId={lotId}
  getOccupancy(lotId?: number): Observable<number> {
    return lotId
      ? this.api.get<number>('analytics/occupancy', { lotId })
      : this.api.get<number>('analytics/occupancy');
  }

  // GET /analytics/{lotId}/occupancy-rate
  getOccupancyRate(lotId: number): Observable<number> {
    return this.api.get<number>(`analytics/${lotId}/occupancy-rate`);
  }

  // GET /analytics/{lotId}/by-hour
  getOccupancyByHour(lotId: number): Observable<Record<number, number>> {
    return this.api.get<Record<number, number>>(`analytics/${lotId}/by-hour`);
  }

  // GET /analytics/{lotId}/peak-hours
  getPeakHours(lotId: number): Observable<number[]> {
    return this.api.get<number[]>(`analytics/${lotId}/peak-hours`);
  }

  // GET /analytics/{lotId}/revenue
  getRevenue(lotId: number): Observable<number> {
    return this.api.get<number>(`analytics/${lotId}/revenue`);
  }

  // GET /analytics/{lotId}/revenue-by-day
  getRevenueByDay(lotId: number): Observable<Record<string, number>> {
    return this.api.get<Record<string, number>>(`analytics/${lotId}/revenue-by-day`);
  }

  // GET /analytics/{lotId}/spot-types
  getSpotTypes(lotId: number): Observable<Record<string, number>> {
    return this.api.get<Record<string, number>>(`analytics/${lotId}/spot-types`);
  }

  // GET /analytics/{lotId}/avg-duration
  getAvgDuration(lotId: number): Observable<number> {
    return this.api.get<number>(`analytics/${lotId}/avg-duration`);
  }

  // GET /analytics/{lotId}/daily-report
  getDailyReport(lotId: number): Observable<DailyReport> {
    return this.api.get<DailyReport>(`analytics/${lotId}/daily-report`);
  }
}
