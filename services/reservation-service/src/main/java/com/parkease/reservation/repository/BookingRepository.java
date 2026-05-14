package com.parkease.reservation.repository;

import com.parkease.reservation.model.Booking;
import com.parkease.reservation.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByLotId(Long lotId);

    List<Booking> findBySpotId(Long spotId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByVehiclePlate(String vehiclePlate);

    long countByLotIdAndStatus(Long lotId, BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.spotId = :spotId AND b.status IN ('RESERVED', 'ACTIVE')")
    Optional<Booking> findActiveBySpotId(@Param("spotId") Long spotId);
}
