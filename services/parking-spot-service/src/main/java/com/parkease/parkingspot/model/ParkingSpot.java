package com.parkease.parkingspot.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

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
  @GeneratedValue(generator = "UUID")
  @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
  @Column(name = "spot_id", updatable = false, nullable = false)
  @EqualsAndHashCode.Include
  private UUID spotId;

  @NotNull
  @Column(name = "lot_id", nullable = false)
  private UUID lotId;

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
