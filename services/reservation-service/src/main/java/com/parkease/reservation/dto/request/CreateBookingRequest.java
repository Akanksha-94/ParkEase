package com.parkease.reservation.dto.request;

import com.parkease.reservation.model.BookingType;
import com.parkease.reservation.model.VehicleType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Lot ID is required")
    private UUID lotId;

    @NotNull(message = "Spot ID is required")
    private UUID spotId;

    @NotBlank(message = "Vehicle plate is required")
    private String vehiclePlate;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotNull(message = "Booking type is required")
    private BookingType bookingType;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private LocalDateTime endTime;
}
