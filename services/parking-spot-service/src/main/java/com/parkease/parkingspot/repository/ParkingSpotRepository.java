package com.parkease.parkingspot.repository;

import com.parkease.parkingspot.model.ParkingSpot;
import com.parkease.parkingspot.model.ParkingSpotStatus;
import com.parkease.parkingspot.model.ParkingSpotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, Long> {

  List<ParkingSpot> findByLotId(Long lotId);

  List<ParkingSpot> findByLotIdAndStatus(Long lotId, ParkingSpotStatus status);

  List<ParkingSpot> findByLotIdAndSpotType(Long lotId, ParkingSpotType spotType);

  List<ParkingSpot> findByLotIdAndVehicleType(Long lotId, com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType);


  List<ParkingSpot> findByLotIdAndEvChargingTrue(Long lotId);

  List<ParkingSpot> findByLotIdAndHandicappedTrue(Long lotId);

  List<ParkingSpot> findByStatus(ParkingSpotStatus status);

  long countByLotIdAndStatus(Long lotId, ParkingSpotStatus status);
}
