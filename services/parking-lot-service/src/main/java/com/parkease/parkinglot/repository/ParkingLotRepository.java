package com.parkease.parkinglot.repository;

import com.parkease.parkinglot.model.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link ParkingLot}.
 *
 * <p>Provides standard CRUD, plus domain-specific finders used by
 * {@link com.parkease.parkinglot.service.ParkingLotServiceImpl}.
 */
@Repository
public interface ParkingLotRepository extends JpaRepository<ParkingLot, UUID> {

    /**
     * Find all lots managed by a specific manager (user).
     */
    List<ParkingLot> findByManagerId(UUID managerId);

    /**
     * Find all lots in a given city (regardless of approval status).
     */
    List<ParkingLot> findByCity(String city);

    /**
     * Find all lots that currently have available spots greater than a threshold.
     */
    List<ParkingLot> findByAvailableSpotsGreaterThan(int minAvailable);

    /**
     * Count the total number of lots in a city.
     */
    long countByCity(String city);

    /**
     * Find all approved lots only (visible to drivers).
     */
    List<ParkingLot> findByIsApprovedTrue();

    /**
     * Find all approved lots in a given city.
     */
    List<ParkingLot> findByCityAndIsApprovedTrue(String city);

    /**
     * Find all open and approved lots (available for booking right now).
     */
    List<ParkingLot> findByIsOpenTrueAndIsApprovedTrue();

    /**
     * Geo-proximity search: find approved lots within {@code radiusKm} kilometres
     * of the supplied coordinate using the Haversine formula expressed in JPQL.
     */
    @Query("""
            SELECT p FROM ParkingLot p
            WHERE p.isApproved = true
              AND (6371 * acos(
                    cos(radians(:lat)) * cos(radians(p.latitude)) *
                    cos(radians(p.longitude) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(p.latitude))
                  )) <= :radiusKm
            ORDER BY (6371 * acos(
                    cos(radians(:lat)) * cos(radians(p.latitude)) *
                    cos(radians(p.longitude) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(p.latitude))
                  )) ASC
            """)
    List<ParkingLot> findNearby(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );

    /**
     * Delete all lots managed by a given manager (e.g., when manager account is removed).
     */
    void deleteByManagerId(UUID managerId);
}
