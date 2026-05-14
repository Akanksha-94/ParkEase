import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// Matches ParkingLotResponse from backend exactly
export interface ParkingLot {
  lotId: number;       // backend returns 'lotId', not 'id'
  id?: number;         // alias for convenience
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;  // backend field name (both request and response)
  isOpen: boolean;
  isApproved: boolean;
  managerId: number;
  openTime?: string;
  closeTime?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  // Kept for backwards compat with any old template references
  baseRatePerHour?: number;
  state?: string;
  zipCode?: string;
}

@Injectable({ providedIn: 'root' })
export class ParkingLotService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, string>): Observable<ParkingLot[]> {
    return this.api.get<ParkingLot[]>('lots', params);
  }

  getById(id: number): Observable<ParkingLot> {
    return this.api.get<ParkingLot>(`lots/${id}`);
  }

  create(data: Record<string, unknown>): Observable<ParkingLot> {
    return this.api.post<ParkingLot>('lots', data);
  }

  update(id: number, data: Record<string, unknown>): Observable<ParkingLot> {
    return this.api.patch<ParkingLot>(`lots/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`lots/${id}`);
  }

  toggleOpen(id: number): Observable<ParkingLot> {
    return this.api.post<ParkingLot>(`lots/${id}/toggle-open`);
  }

  approve(id: number): Observable<ParkingLot> {
    return this.api.post<ParkingLot>(`lots/${id}/approve`);
  }
}
