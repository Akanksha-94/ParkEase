package com.parkease.report.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import jakarta.persistence.GenerationType;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private Long logId;

    @Column(name = "lot_id", nullable = false)
    private Long lotId;

    @Column(name = "spot_id")
    private Long spotId;

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
