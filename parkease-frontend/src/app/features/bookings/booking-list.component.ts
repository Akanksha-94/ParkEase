import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { Booking } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, StatusBadgeComponent],
  template: `
    @if (bookings.length) {
      <section class="panel table">
        @for (booking of bookings; track booking.bookingId) {
          <div class="row">
            <strong>#{{ booking.bookingId }}</strong>
            <span>{{ booking.vehiclePlate }}</span>
            <span>{{ booking.startTime | date:'short' }}</span>
            <app-status-badge [label]="booking.status" />
            <span>{{ booking.totalAmount | currency:'INR' }}</span>
          </div>
        }
      </section>
    } @else {
      <section class="panel empty-state">{{ loading ? 'Loading bookings...' : 'No bookings found.' }}</section>
    }
  `,
  styles: `
    .table {
      overflow: hidden;
    }

    .row {
      align-items: center;
      border-top: 1px solid var(--border);
      display: grid;
      gap: 12px;
      grid-template-columns: 0.7fr 1fr 1.4fr 1fr 1fr;
      padding: 16px;
    }

    .row:first-child {
      border-top: 0;
    }

    @media (max-width: 800px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class BookingListComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);

  loading = true;
  bookings: Booking[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    const request = user.role === 'ADMIN' ? this.bookingService.getActiveBookings() : this.bookingService.getBookingsByUser(user.userId);
    request.subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: () => {
        this.bookings = [];
        this.loading = false;
      }
    });
  }
}
