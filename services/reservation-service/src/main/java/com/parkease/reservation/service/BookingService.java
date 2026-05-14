package com.parkease.reservation.service;

import com.parkease.reservation.dto.request.CreateBookingRequest;
import com.parkease.reservation.dto.response.BookingResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);

    BookingResponse getBookingById(Long bookingId);

    List<BookingResponse> getBookingsByUser(Long userId);

    List<BookingResponse> getBookingsByLot(Long lotId);

    List<BookingResponse> getActiveBookings();

    List<BookingResponse> getAllBookings();

    BookingResponse cancelBooking(Long bookingId);

    BookingResponse checkIn(Long bookingId);

    BookingResponse checkOut(Long bookingId);

    BookingResponse extendBooking(Long bookingId, LocalDateTime newEndTime);

    BigDecimal calculateAmount(Long bookingId);

    List<BookingResponse> getBookingHistory(Long userId);
}
