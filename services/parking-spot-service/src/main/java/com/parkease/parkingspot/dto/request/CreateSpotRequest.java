package com.parkease.parkingspot.dto.request;

import com.parkease.parkingspot.model.ParkingSpotType;
import com.parkease.parkingspot.model.ParkingSpotVehicleType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSpotRequest {

  @NotNull(message = "Lot ID is required")
  private UUID lotId;

  @NotBlank(message = "Spot number is required")
  private String spotNumber;

  private String floor;

  @NotNull(message = "Spot type is required")
  private ParkingSpotType spotType;

  @NotNull(message = "Vehicle type is required")
  private ParkingSpotVehicleType vehicleType;

  @Builder.Default
  private boolean handicapped = false;

  @Builder.Default
  private boolean evCharging = false;

  @NotNull(message = "Price per hour is required")
  @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
  private BigDecimal pricePerHour;
}
