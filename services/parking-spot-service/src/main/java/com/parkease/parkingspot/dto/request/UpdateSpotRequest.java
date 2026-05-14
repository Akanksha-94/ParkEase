package com.parkease.parkingspot.dto.request;

import com.parkease.parkingspot.model.ParkingSpotStatus;
import com.parkease.parkingspot.model.ParkingSpotType;
import com.parkease.parkingspot.model.ParkingSpotVehicleType;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSpotRequest {

  private String spotNumber;

  private String floor;

  private ParkingSpotType spotType;

  private ParkingSpotVehicleType vehicleType;

  private ParkingSpotStatus status;

  private Boolean handicapped;

  private Boolean evCharging;

  @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
  private BigDecimal pricePerHour;
}
