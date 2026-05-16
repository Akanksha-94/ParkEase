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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;

    @Value("${parkease.services.parking-spot-service.url:http://parking-spot-service/spots}")
    private String spotServiceUrl;

    @Value("${parkease.services.parking-lot-service.url:http://parking-lot-service/lots}")
    private String lotServiceUrl;

    @Value("${parkease.internal.gateway-secret:ParkEaseGateway2024}")
    private String gatewaySecret;

    @Value("${parkease.services.notification-service.url:http://notification-service/notifications}")
    private String notificationServiceUrl;

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new BookingException("Start time must be before end time");
        }

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

        // Mark spot as RESERVED in spot-service (internal call)
        callSpotService(request.getSpotId(), "reserve");

        // Decrement lot available spots (internal call)
        callLotService(request.getLotId(), "decrement");

        // Get Manager ID
        Long managerId = getManagerIdForLot(request.getLotId());

        // Send Notification to Driver
        sendNotification(saved.getUserId(), "BOOKING", "Reservation Confirmed",
                "Your reservation for " + saved.getVehiclePlate() + " has been successfully created.");

        // Send Notification to Manager
        if (managerId != null) {
            sendNotification(managerId, "BOOKING", "New Booking Received",
                    "A new booking has been made for your lot " + saved.getLotId() + " (Vehicle: " + saved.getVehiclePlate() + ")");
        }

        return toResponse(saved);
    }

    @Override
    public BookingResponse getBookingById(Long bookingId) {
        return toResponse(findOrThrow(bookingId));
    }

    @Override
    public List<BookingResponse> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getBookingsByLot(Long lotId) {
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
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingException("Cannot cancel a completed or already cancelled booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Release spot
        callSpotService(booking.getSpotId(), "release");

        // Increment lot available spots
        callLotService(booking.getLotId(), "increment");

        // Get Manager ID
        Long managerId = getManagerIdForLot(booking.getLotId());

        // Send Notification to Driver
        sendNotification(booking.getUserId(), "BOOKING", "Reservation Cancelled",
                "Your reservation for " + booking.getVehiclePlate() + " has been cancelled.");

        // Send Notification to Manager
        if (managerId != null) {
            sendNotification(managerId, "BOOKING", "Booking Cancelled",
                    "A booking has been cancelled in your lot " + booking.getLotId() + " (Vehicle: " + booking.getVehiclePlate() + ")");
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse checkIn(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.RESERVED) {
            throw new BookingException("Booking is not in RESERVED state");
        }

        booking.setStatus(BookingStatus.ACTIVE);
        Booking saved = bookingRepository.save(booking);

        // Mark spot as OCCUPIED
        callSpotService(booking.getSpotId(), "occupy");

        // Get Manager ID
        Long managerId = getManagerIdForLot(booking.getLotId());

        // Send Notification to Driver
        sendNotification(booking.getUserId(), "CHECKIN", "Check-in Successful",
                "You have successfully checked into your spot.");

        // Send Notification to Manager
        if (managerId != null) {
            sendNotification(managerId, "CHECKIN", "Driver Checked In",
                    "Vehicle " + booking.getVehiclePlate() + " has checked into your lot.");
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse checkOut(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BookingException("Booking is not in ACTIVE state");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setTotalAmount(calculateAmountInternal(booking));
        Booking saved = bookingRepository.save(booking);

        // Release spot
        callSpotService(booking.getSpotId(), "release");

        // Increment lot available spots
        callLotService(booking.getLotId(), "increment");

        // Send Notification
        sendNotification(booking.getUserId(), "CHECKOUT", "Session Completed",
                "You have checked out. Total amount: $" + saved.getTotalAmount());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse extendBooking(Long bookingId, LocalDateTime newEndTime) {
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
    public BigDecimal calculateAmount(Long bookingId) {
        return calculateAmountInternal(findOrThrow(bookingId));
    }

    @Override
    public List<BookingResponse> getBookingHistory(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED
                          || b.getStatus() == BookingStatus.CANCELLED)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(Long bookingId, CreateBookingRequest request) {
        Booking booking = findOrThrow(bookingId);
        
        // If spot changed, release old and reserve new
        if (!booking.getSpotId().equals(request.getSpotId())) {
            callSpotService(booking.getSpotId(), "release");
            callSpotService(request.getSpotId(), "reserve");
        }
        
        // If lot changed, increment old and decrement new
        if (!booking.getLotId().equals(request.getLotId())) {
            callLotService(booking.getLotId(), "increment");
            callLotService(request.getLotId(), "decrement");
        }

        booking.setLotId(request.getLotId());
        booking.setSpotId(request.getSpotId());
        booking.setVehiclePlate(request.getVehiclePlate());
        booking.setVehicleType(request.getVehicleType());
        booking.setBookingType(request.getBookingType());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public void deleteBooking(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        // Clean up external resources if it was active/reserved
        if (booking.getStatus() == BookingStatus.RESERVED || booking.getStatus() == BookingStatus.ACTIVE) {
            callSpotService(booking.getSpotId(), "release");
            callLotService(booking.getLotId(), "increment");
        }
        bookingRepository.delete(booking);
    }

    // ── Inter-service calls ───────────────────────────────────────────────────

    private void callSpotService(Long spotId, String action) {
        if (spotId == null) return;
        try {
            String url = spotServiceUrl + "/" + spotId + "/" + action;
            restTemplate.exchange(url, HttpMethod.PUT, buildInternalRequest(), Void.class);
            log.info("Spot-service action '{}' called for spot {}", action, spotId);
        } catch (Exception ex) {
            log.warn("Spot-service call '{}' failed for spot {}: {}", action, spotId, ex.getMessage());
        }
    }

    private void callLotService(Long lotId, String action) {
        if (lotId == null) return;
        try {
            String url = lotServiceUrl + "/" + lotId + "/" + action;
            restTemplate.exchange(url, HttpMethod.POST, buildInternalRequest(), Void.class);
            log.info("Lot-service action '{}' called for lot {}", action, lotId);
        } catch (Exception ex) {
            log.warn("Lot-service call '{}' failed for lot {}: {}", action, lotId, ex.getMessage());
        }
    }

    private HttpEntity<Void> buildInternalRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Gateway-Secret", gatewaySecret);
        headers.set("X-User-Name", "reservation-service");
        headers.set("X-User-Roles", "SYSTEM");
        return new HttpEntity<>(headers);
    }

    private void sendNotification(Long userId, String type, String title, String message) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("recipientId", userId);
            body.put("type", type);
            body.put("title", title);
            body.put("message", message);
            body.put("channel", "APP");

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Name", "reservation-service");
            headers.set("X-User-Roles", "SYSTEM");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(notificationServiceUrl, entity, Void.class);
            log.info("Notification sent to user {}: {}", userId, title);
        } catch (Exception ex) {
            log.warn("Failed to send notification to user {}: {}", userId, ex.getMessage());
        }
    }

    private Long getManagerIdForLot(Long lotId) {
        if (lotId == null) return null;
        try {
            String url = lotServiceUrl + "/" + lotId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Gateway-Secret", gatewaySecret);
            headers.set("X-User-Name", "reservation-service");
            headers.set("X-User-Roles", "SYSTEM");
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            if (response.getBody() != null && response.getBody().get("data") != null) {
                Map data = (Map) response.getBody().get("data");
                Object managerId = data.get("managerId");
                return managerId != null ? Long.valueOf(managerId.toString()) : null;
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch managerId for lot {}: {}", lotId, ex.getMessage());
        }
        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal calculateAmountInternal(Booking booking) {
        long hours = Duration.between(booking.getStartTime(), booking.getEndTime()).toHours();
        if (hours < 1) hours = 1;
        return BigDecimal.valueOf(hours * 10L);
    }

    private Booking findOrThrow(Long bookingId) {
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
