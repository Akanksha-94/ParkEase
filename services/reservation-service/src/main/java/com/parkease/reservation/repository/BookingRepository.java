package com.parkease.reservation.repository;

import com.parkease.reservation.model.Booking;
import com.parkease.reservation.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUserId(UUID userId);

    List<Booking> findByLotId(UUID lotId);

    List<Booking> findBySpotId(UUID spotId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByVehiclePlate(String vehiclePlate);

    long countByLotIdAndStatus(UUID lotId, BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.spotId = :spotId AND b.status IN ('RESERVED', 'ACTIVE')")
    Optional<Booking> findActiveBySpotId(@Param("spotId") UUID spotId);
}
