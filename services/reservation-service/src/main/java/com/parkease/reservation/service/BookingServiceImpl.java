package com.parkease.reservation.service;

import com.parkease.reservation.dto.request.CreateBookingRequest;
import com.parkease.reservation.dto.response.BookingResponse;
import com.parkease.reservation.exception.BookingException;
import com.parkease.reservation.exception.BookingNotFoundException;
import com.parkease.reservation.model.Booking;
import com.parkease.reservation.model.BookingStatus;
import com.parkease.reservation.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;

    @Value("${parkease.services.parking-spot-service.url}")
    private String spotServiceUrl;

    @Value("${parkease.services.parking-lot-service.url}")
    private String lotServiceUrl;

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        // Validate dates
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new BookingException("Start time must be before end time");
        }

        // Create booking
        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .lotId(request.getLotId())
                .spotId(request.getSpotId())
                .vehiclePlate(request.getVehiclePlate())
                .vehicleType(request.getVehicleType())
                .bookingType(request.getBookingType())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(BookingStatus.RESERVED)
                .build();

        Booking saved = bookingRepository.save(booking);

        // Call Spot Service to mark spot Reserved (Mock call for now)
        try {
            log.info("Calling Spot Service to mark spot {} as Reserved", request.getSpotId());
            // restTemplate.put(spotServiceUrl + "/" + request.getSpotId() + "/occupy", null);
        } catch (Exception e) {
            log.error("Failed to update spot status: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId) {
        return toResponse(findOrThrow(bookingId));
    }

    @Override
    public List<BookingResponse> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getBookingsByLot(UUID lotId) {
        return bookingRepository.findByLotId(lotId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getActiveBookings() {
        return bookingRepository.findByStatus(BookingStatus.ACTIVE).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingException("Cannot cancel a completed or already cancelled booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Call Spot Service to release spot
        try {
            log.info("Calling Spot Service to release spot {}", booking.getSpotId());
        } catch (Exception e) {
            log.error("Failed to release spot: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse checkIn(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.RESERVED) {
            throw new BookingException("Booking is not in RESERVED state");
        }

        booking.setStatus(BookingStatus.ACTIVE);
        Booking saved = bookingRepository.save(booking);

        // Call Spot Service to occupy spot
        try {
            log.info("Calling Spot Service to occupy spot {}", booking.getSpotId());
        } catch (Exception e) {
            log.error("Failed to occupy spot: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse checkOut(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BookingException("Booking is not in ACTIVE state");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setTotalAmount(calculateAmountInternal(booking));
        Booking saved = bookingRepository.save(booking);

        // Call Spot Service to release spot
        try {
            log.info("Calling Spot Service to release spot {}", booking.getSpotId());
        } catch (Exception e) {
            log.error("Failed to release spot: {}", e.getMessage());
        }

        // Increment available spots in Lot Service
        try {
            log.info("Calling Lot Service to increment available spots for lot {}", booking.getLotId());
        } catch (Exception e) {
            log.error("Failed to update lot available spots: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse extendBooking(UUID bookingId, LocalDateTime newEndTime) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingException("Cannot extend a completed or cancelled booking");
        }
        if (newEndTime.isBefore(booking.getEndTime())) {
            throw new BookingException("New end time must be after current end time");
        }

        booking.setEndTime(newEndTime);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public BigDecimal calculateAmount(UUID bookingId) {
        Booking booking = findOrThrow(bookingId);
        return calculateAmountInternal(booking);
    }

    @Override
    public List<BookingResponse> getBookingHistory(UUID userId) {
        return bookingRepository.findByUserId(userId).stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CANCELLED)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private BigDecimal calculateAmountInternal(Booking booking) {
        // Simple logic for calculation, assuming $10 per hour
        long hours = Duration.between(booking.getStartTime(), booking.getEndTime()).toHours();
        if (hours < 1) hours = 1;
        return BigDecimal.valueOf(hours * 10);
    }

    private Booking findOrThrow(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found: " + bookingId));
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .userId(booking.getUserId())
                .lotId(booking.getLotId())
                .spotId(booking.getSpotId())
                .vehiclePlate(booking.getVehiclePlate())
                .vehicleType(booking.getVehicleType())
                .bookingType(booking.getBookingType())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .totalAmount(booking.getTotalAmount())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
