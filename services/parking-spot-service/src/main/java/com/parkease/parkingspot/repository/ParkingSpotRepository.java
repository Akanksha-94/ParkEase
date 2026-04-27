package com.parkease.parkingspot.repository;

import com.parkease.parkingspot.model.ParkingSpot;
import com.parkease.parkingspot.model.ParkingSpotStatus;
import com.parkease.parkingspot.model.ParkingSpotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, UUID> {

  List<ParkingSpot> findByLotId(UUID lotId);

  List<ParkingSpot> findByLotIdAndStatus(UUID lotId, ParkingSpotStatus status);

  List<ParkingSpot> findByLotIdAndSpotType(UUID lotId, ParkingSpotType spotType);

  List<ParkingSpot> findByLotIdAndVehicleType(UUID lotId, com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType);


  List<ParkingSpot> findByLotIdAndEvChargingTrue(UUID lotId);

  List<ParkingSpot> findByLotIdAndHandicappedTrue(UUID lotId);

  long countByLotIdAndStatus(UUID lotId, ParkingSpotStatus status);
}
