package com.parkease.reservation.resource;

import com.parkease.reservation.common.response.ApiResponse;
import com.parkease.reservation.dto.request.CreateBookingRequest;
import com.parkease.reservation.dto.response.BookingResponse;
import com.parkease.reservation.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller exposing booking/reservation operations.
 * Base path after StripPrefix=2: /bookings
 */
@RestController
@RequestMapping("/bookings")
@Validated
@RequiredArgsConstructor
@Slf4j
public class BookingResource {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request) {
        log.info("POST /bookings - userId: {}, lotId: {}", request.getUserId(), request.getLotId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Booking created successfully", bookingService.createBooking(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(
                ApiResponse.success("All bookings retrieved", bookingService.getAllBookings()));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ApiResponse.success("Booking retrieved", bookingService.getBookingById(bookingId)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsByUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                ApiResponse.success("User bookings retrieved", bookingService.getBookingsByUser(userId)));
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsByLot(
            @PathVariable Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lot bookings retrieved", bookingService.getBookingsByLot(lotId)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getActiveBookings() {
        return ResponseEntity.ok(
                ApiResponse.success("Active bookings retrieved", bookingService.getActiveBookings()));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingHistory(
            @RequestParam Long userId) {
        return ResponseEntity.ok(
                ApiResponse.success("Booking history retrieved", bookingService.getBookingHistory(userId)));
    }

    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ApiResponse.success("Booking cancelled", bookingService.cancelBooking(bookingId)));
    }

    @PutMapping("/{bookingId}/checkin")
    public ResponseEntity<ApiResponse<BookingResponse>> checkIn(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ApiResponse.success("Check-in successful", bookingService.checkIn(bookingId)));
    }

    @PutMapping("/{bookingId}/checkout")
    public ResponseEntity<ApiResponse<BookingResponse>> checkOut(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ApiResponse.success("Check-out successful", bookingService.checkOut(bookingId)));
    }

    @PutMapping("/{bookingId}/extend")
    public ResponseEntity<ApiResponse<BookingResponse>> extendBooking(
            @PathVariable Long bookingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newEndTime) {
        return ResponseEntity.ok(
                ApiResponse.success("Booking extended", bookingService.extendBooking(bookingId, newEndTime)));
    }

    @GetMapping("/{bookingId}/amount")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateAmount(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ApiResponse.success("Amount calculated", bookingService.calculateAmount(bookingId)));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody CreateBookingRequest request) {
        log.info("PUT /bookings/{} - Updating booking", bookingId);
        return ResponseEntity.ok(
                ApiResponse.success("Booking updated successfully", bookingService.updateBooking(bookingId, request)));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable Long bookingId) {
        log.info("DELETE /bookings/{} - Deleting booking", bookingId);
        bookingService.deleteBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.success("Booking deleted successfully", null));
    }
}
