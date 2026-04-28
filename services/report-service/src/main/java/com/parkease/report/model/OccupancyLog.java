package com.parkease.report.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "occupancy_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OccupancyLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "log_id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID logId;

    @Column(name = "lot_id", nullable = false)
    private UUID lotId;

    @Column(name = "spot_id")
    private UUID spotId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "occupancy_rate", nullable = false)
    private double occupancyRate;

    @Column(name = "available_spots", nullable = false)
    private int availableSpots;

    @Column(name = "total_spots", nullable = false)
    private int totalSpots;

    @Column(name = "vehicle_type")
    private String vehicleType;
}
