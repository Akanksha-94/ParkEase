package com.parkease.reservation.resource;

import com.parkease.reservation.dto.request.CreateBookingRequest;
import com.parkease.reservation.dto.response.BookingResponse;
import com.parkease.reservation.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@Validated
@RequiredArgsConstructor
public class BookingResource {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByLot(@PathVariable UUID lotId) {
        return ResponseEntity.ok(bookingService.getBookingsByLot(lotId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<BookingResponse>> getActiveBookings() {
        return ResponseEntity.ok(bookingService.getActiveBookings());
    }

    @GetMapping("/history")
    public ResponseEntity<List<BookingResponse>> getBookingHistory(@RequestParam UUID userId) {
        return ResponseEntity.ok(bookingService.getBookingHistory(userId));
    }

    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId));
    }

    @PutMapping("/{bookingId}/checkin")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.checkIn(bookingId));
    }

    @PutMapping("/{bookingId}/checkout")
    public ResponseEntity<BookingResponse> checkOut(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.checkOut(bookingId));
    }

    @PutMapping("/{bookingId}/extend")
    public ResponseEntity<BookingResponse> extendBooking(
            @PathVariable UUID bookingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newEndTime) {
        return ResponseEntity.ok(bookingService.extendBooking(bookingId, newEndTime));
    }

    @GetMapping("/{bookingId}/amount")
    public ResponseEntity<BigDecimal> calculateAmount(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.calculateAmount(bookingId));
    }
}
