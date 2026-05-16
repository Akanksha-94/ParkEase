import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Reservation {
  bookingId: number; id?: number; userId: number; spotId: number; lotId: number;
  vehicleId: number; vehiclePlate?: string; vehicleType?: string; spotNumber?: string; lotName?: string;
  startTime: string; endTime: string; status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalAmount?: number; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private api: ApiService, private auth: AuthService) { }

  getAll(): Observable<Reservation[]> { return this.api.get<Reservation[]>('bookings'); }
  getById(id: number): Observable<Reservation> { return this.api.get<Reservation>(`bookings/${id}`); }

  getMyReservations(): Observable<Reservation[]> {
    const userId = this.auth.currentUser?.userId ?? this.auth.currentUser?.id;
    return this.api.get<Reservation[]>(`bookings/user/${userId}`);
  }

  create(data: Partial<Reservation>): Observable<Reservation> { return this.api.post<Reservation>('bookings', data); }
  cancel(id: number): Observable<Reservation> { return this.api.put<Reservation>(`bookings/${id}/cancel`); }
  checkin(id: number): Observable<Reservation> { return this.api.put<Reservation>(`bookings/${id}/checkin`); }
  checkout(id: number): Observable<Reservation> { return this.api.put<Reservation>(`bookings/${id}/checkout`); }
  extend(id: number, newEndTime: string): Observable<Reservation> {
    return this.api.put<Reservation>(`bookings/${id}/extend?newEndTime=${encodeURIComponent(newEndTime)}`);
  }
  getAmount(id: number): Observable<number> { return this.api.get<number>(`bookings/${id}/amount`); }

  update(id: number, data: Partial<Reservation>): Observable<Reservation> {
    return this.api.put<Reservation>(`bookings/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`bookings/${id}`);
  }
}
