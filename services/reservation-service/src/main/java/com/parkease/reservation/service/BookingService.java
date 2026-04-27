package com.parkease.reservation.service;

import com.parkease.reservation.dto.request.CreateBookingRequest;
import com.parkease.reservation.dto.response.BookingResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);

    BookingResponse getBookingById(UUID bookingId);

    List<BookingResponse> getBookingsByUser(UUID userId);

    List<BookingResponse> getBookingsByLot(UUID lotId);

    List<BookingResponse> getActiveBookings();

    BookingResponse cancelBooking(UUID bookingId);

    BookingResponse checkIn(UUID bookingId);

    BookingResponse checkOut(UUID bookingId);

    BookingResponse extendBooking(UUID bookingId, LocalDateTime newEndTime);

    BigDecimal calculateAmount(UUID bookingId);

    List<BookingResponse> getBookingHistory(UUID userId);
}
