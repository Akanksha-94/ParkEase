package com.parkease.parkinglot.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * JPA entity representing a parking lot facility in the ParkEase platform.
 *
 * <p>Each lot stores geo-location for GPS-based proximity discovery,
 * operating hours, total/available spots, manager assignment,
 * admin-approval status, and an image URL for the UI.
 */
@Entity
@Table(name = "parking_lots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"imageUrl"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ParkingLot {

    // ── Identity ──────────────────────────────────────────────────────────────

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "lot_id", updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID lotId;

    // ── Basic Info ────────────────────────────────────────────────────────────

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false)
    private String address;

    @NotBlank
    @Column(nullable = false)
    private String city;

    // ── Geo Location ──────────────────────────────────────────────────────────

    @NotNull
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @NotNull
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    // ── Capacity ──────────────────────────────────────────────────────────────

    @NotNull
    @Min(1)
    @Column(name = "total_spots", nullable = false)
    private Integer totalSpots;

    /**
     * Available spots counter. Decremented atomically on booking,
     * incremented on checkout or cancellation.
     */
    @Column(name = "available_spots", nullable = false)
    @Builder.Default
    private Integer availableSpots = 0;

    // ── Pricing ───────────────────────────────────────────────────────────────

    @NotNull
    @Column(name = "hourly_rate", nullable = false, precision = 8, scale = 2)
    private BigDecimal hourlyRate;

    // ── Operations ────────────────────────────────────────────────────────────

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    // ── Ownership & Status ────────────────────────────────────────────────────

    /**
     * UUID of the manager (user) who owns this lot — references auth-service.
     */
    @Column(name = "manager_id", nullable = false)
    private UUID managerId;

    /**
     * Whether the lot is open for bookings (admin-controlled).
     */
    @Builder.Default
    @Column(name = "is_open", nullable = false)
    private boolean isOpen = false;

    /**
     * Admin approval is required before a lot becomes searchable by drivers.
     */
    @Builder.Default
    @Column(name = "is_approved", nullable = false)
    private boolean isApproved = false;

    // ── Media ─────────────────────────────────────────────────────────────────

    @Column(name = "image_url")
    private String imageUrl;

    // ── Audit ─────────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
