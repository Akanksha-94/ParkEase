import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Payment {
  id: number; bookingId: number; userId: number; lotId: number;
  amount: number; status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  mode: string; currency: string; description?: string;
  transactionId?: string; createdAt: string; updatedAt?: string;
}

export type PaymentMode = 'CARD' | 'UPI' | 'WALLET' | 'CASH';

export interface ProcessPaymentPayload {
  bookingId: number;
  userId: number;
  lotId: number;
  amount: number;
  mode: PaymentMode;
  currency: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private get userId(): number {
    return (this.auth.currentUser?.userId ?? this.auth.currentUser?.id) as number;
  }

  // GET /payments/user/{userId}
  getMyPayments(): Observable<Payment[]> {
    return this.api.get<Payment[]>(`payments/user/${this.userId}`);
  }

  // GET /payments/{id}
  getById(id: number): Observable<Payment> {
    return this.api.get<Payment>(`payments/${id}`);
  }

  // GET /payments/booking/{bookingId}
  getByBooking(bookingId: number): Observable<Payment> {
    return this.api.get<Payment>(`payments/booking/${bookingId}`);
  }

  // POST /payments  (alias for /payments/process)
  processPayment(payload: ProcessPaymentPayload): Observable<Payment> {
    return this.api.post<Payment>('payments', payload);
  }

  // POST /payments/{paymentId}/refund
  refundPayment(paymentId: number, reason: string): Observable<Payment> {
    return this.api.post<Payment>(`payments/${paymentId}/refund`, { reason });
  }

  // GET /payments/{paymentId}/receipt
  getReceipt(paymentId: number): Observable<string> {
    return this.api.get<string>(`payments/${paymentId}/receipt`);
  }

  // GET /payments/{paymentId}/status
  getStatus(paymentId: number): Observable<string> {
    return this.api.get<string>(`payments/${paymentId}/status`);
  }
}
