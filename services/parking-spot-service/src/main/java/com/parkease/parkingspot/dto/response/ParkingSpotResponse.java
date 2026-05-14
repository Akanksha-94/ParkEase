package com.parkease.parkingspot.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parkease.parkingspot.model.ParkingSpotStatus;
import com.parkease.parkingspot.model.ParkingSpotType;
import com.parkease.parkingspot.model.ParkingSpotVehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingSpotResponse {

  private Long spotId;
  private Long lotId;
  private String spotNumber;
  private String floor;
  private ParkingSpotType spotType;
  private ParkingSpotVehicleType vehicleType;
  private ParkingSpotStatus status;
  private boolean handicapped;
  private boolean evCharging;
  private BigDecimal pricePerHour;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAt;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime updatedAt;
}
