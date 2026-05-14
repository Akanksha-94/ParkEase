import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Vehicle {
  vehicleId: number;
  ownerId: number;
  licensePlate: string;
  vehicleType: string;
  make?: string; model?: string; color?: string;
  active: boolean;
  ev: boolean;
  registeredAt?: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private api: ApiService, private auth: AuthService) {}

  getMyVehicles(): Observable<Vehicle[]> {
    const userId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id;
    return this.api.get<Vehicle[]>(`vehicles/owner/${userId}`);
  }

  getAll(): Observable<Vehicle[]> { return this.api.get<Vehicle[]>('vehicles/all'); }
  getById(id: number): Observable<Vehicle> { return this.api.get<Vehicle>(`vehicles/${id}`); }
  create(data: Partial<Vehicle>): Observable<Vehicle> { return this.api.post<Vehicle>('vehicles', data); }
  update(id: number, data: Partial<Vehicle>): Observable<Vehicle> { return this.api.put<Vehicle>(`vehicles/${id}`, data); }
  delete(id: number): Observable<void> { return this.api.delete<void>(`vehicles/${id}`); }
}
