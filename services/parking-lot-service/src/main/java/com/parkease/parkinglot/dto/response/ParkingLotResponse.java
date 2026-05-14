package com.parkease.parkinglot.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Response DTO for parking lot details returned to clients.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingLotResponse {

    private Long lotId;
    private String name;
    private String address;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer totalSpots;
    private Integer availableSpots;
    private BigDecimal hourlyRate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime openTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime closeTime;

    private Long managerId;
    private boolean isOpen;
    private boolean isApproved;
    private String imageUrl;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
