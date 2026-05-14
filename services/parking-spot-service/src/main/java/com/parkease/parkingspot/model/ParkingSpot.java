package com.parkease.parkingspot.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "parking_spots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "pricePerHour" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ParkingSpot {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "spot_id", updatable = false, nullable = false)
  @EqualsAndHashCode.Include
  private Long spotId;

  @NotNull
  @Column(name = "lot_id", nullable = false)
  private Long lotId;

  @NotBlank
  @Column(name = "spot_number", nullable = false)
  private String spotNumber;

  @Column(name = "floor")
  private String floor;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(name = "spot_type", nullable = false)
  private ParkingSpotType spotType;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(name = "vehicle_type", nullable = false)
  private ParkingSpotVehicleType vehicleType;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ParkingSpotStatus status;

  @Column(name = "is_handicapped", nullable = false)
  @Builder.Default
  private boolean handicapped = false;

  @Column(name = "is_ev_charging", nullable = false)
  @Builder.Default
  private boolean evCharging = false;

  @NotNull
  @DecimalMin(value = "0.0", inclusive = false)
  @Column(name = "price_per_hour", nullable = false, precision = 8, scale = 2)
  private BigDecimal pricePerHour;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
