package com.parkease.parkinglot.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Request DTO for creating a new parking lot.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateLotRequest {

    @NotBlank(message = "Lot name is required")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private BigDecimal longitude;

    @NotNull(message = "Total spots is required")
    @Min(value = 1, message = "Total spots must be at least 1")
    private Integer totalSpots;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be positive")
    private BigDecimal hourlyRate;

    private LocalTime openTime;

    private LocalTime closeTime;

    /**
     * Manager UUID — set from the authenticated JWT principal in the resource layer.
     * Must be supplied explicitly when called from admin context.
     */
    @NotNull(message = "Manager ID is required")
    private UUID managerId;

    private String imageUrl;
}
