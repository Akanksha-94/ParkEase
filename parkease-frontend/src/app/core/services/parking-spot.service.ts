import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ParkingSpot {
  spotId: number;
  lotId: number;
  spotNumber: string;
  floor?: string;
  spotType: string;
  vehicleType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  pricePerHour: number;
  handicapped: boolean;
  evCharging: boolean;
}

@Injectable({ providedIn: 'root' })
export class ParkingSpotService {
  constructor(private api: ApiService) {}
  getAll(params?: Record<string,string>): Observable<ParkingSpot[]> { return this.api.get<ParkingSpot[]>('spots', params); }
  getById(id: number): Observable<ParkingSpot> { return this.api.get<ParkingSpot>(`spots/${id}`); }
  getByLot(lotId: number): Observable<ParkingSpot[]> { return this.api.get<ParkingSpot[]>(`spots/lot/${lotId}`); }
  getAvailable(lotId?: number): Observable<ParkingSpot[]> {
    return this.api.get<ParkingSpot[]>('spots/available', lotId ? { lotId } : undefined);
  }
  create(data: Partial<ParkingSpot>): Observable<ParkingSpot> { return this.api.post<ParkingSpot>('spots', data); }
  update(id: number, data: Partial<ParkingSpot>): Observable<ParkingSpot> { return this.api.patch<ParkingSpot>(`spots/${id}`, data); }
  delete(id: number): Observable<void> { return this.api.delete<void>(`spots/${id}`); }
}
