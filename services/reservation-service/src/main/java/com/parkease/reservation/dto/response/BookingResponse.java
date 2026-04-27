package com.parkease.reservation.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parkease.reservation.model.BookingStatus;
import com.parkease.reservation.model.BookingType;
import com.parkease.reservation.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private UUID bookingId;
    private UUID userId;
    private UUID lotId;
    private UUID spotId;
    private String vehiclePlate;
    private VehicleType vehicleType;
    private BookingType bookingType;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private BookingStatus status;
    private BigDecimal totalAmount;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
