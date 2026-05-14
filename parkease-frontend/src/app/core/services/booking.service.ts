import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Booking } from '../models/booking.model';
import { unwrapApiResponse } from '../operators/unwrap-api';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  getActiveBookings(): Observable<Booking[]> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.baseUrl}/active`).pipe(unwrapApiResponse());
  }

  getBookingsByUser(userId: number): Observable<Booking[]> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.baseUrl}/user/${userId}`).pipe(unwrapApiResponse());
  }
}
