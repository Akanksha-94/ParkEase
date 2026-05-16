import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Notification {
  notificationId: number; recipientId: number; title: string; message: string;
  type: 'BOOKING' | 'CHECKIN' | 'CHECKOUT' | 'EXPIRY' | 'PAYMENT' | 'PROMO' | 'SYSTEM' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REMINDER';
  read: boolean;
  createdAt?: string;
  sentAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private get userId(): number {
    return (this.auth.currentUser?.userId ?? this.auth.currentUser?.id) as number;
  }

  // GET /notifications/recipient/{recipientId}
  getMyNotifications(): Observable<Notification[]> {
    return this.api.get<Notification[]>(`notifications/recipient/${this.userId}`);
  }

  // GET /notifications/recipient/{recipientId}/unread-count
  getUnreadCount(): Observable<number> {
    return this.api.get<number>(`notifications/recipient/${this.userId}/unread-count`);
  }

  // PUT /notifications/{notificationId}/read
  markAsRead(id: number): Observable<Notification> {
    return this.api.put<Notification>(`notifications/${id}/read`);
  }

  // PUT /notifications/recipient/{recipientId}/read-all
  markAllRead(): Observable<void> {
    return this.api.put<void>(`notifications/recipient/${this.userId}/read-all`);
  }

  // DELETE /notifications/{notificationId}
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`notifications/${id}`);
  }
}
