package com.parkease.parkinglot.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * Request DTO for updating an existing parking lot.
 * All fields are optional; only non-null values are applied (patch semantics).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateLotRequest {

    private String name;

    private String address;

    private String city;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private BigDecimal longitude;

    @Min(value = 1, message = "Total spots must be at least 1")
    private Integer totalSpots;

    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    private LocalTime openTime;

    private LocalTime closeTime;

    private String imageUrl;

    /** If provided, also updates the isOpen flag directly. */
    private Boolean isOpen;
}
