package com.parkease.parkingspot.service;

import com.parkease.parkingspot.dto.request.CreateSpotRequest;
import com.parkease.parkingspot.dto.request.UpdateSpotRequest;
import com.parkease.parkingspot.dto.response.ParkingSpotResponse;

import java.util.List;


public interface ParkingSpotService {

  ParkingSpotResponse addSpot(CreateSpotRequest request);

  List<ParkingSpotResponse> addBulkSpots(Long lotId, List<CreateSpotRequest> requests);

  ParkingSpotResponse getSpotById(Long spotId);

  List<ParkingSpotResponse> getSpotsByLot(Long lotId);

  List<ParkingSpotResponse> getAvailableSpotsByLot(Long lotId);

  List<ParkingSpotResponse> getAllAvailableSpots();

  List<ParkingSpotResponse> getSpotsByTypeAndLot(Long lotId, com.parkease.parkingspot.model.ParkingSpotType spotType);

  List<ParkingSpotResponse> getSpotsByVehicleTypeAndLot(Long lotId, com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType);


  ParkingSpotResponse updateSpot(Long spotId, UpdateSpotRequest request);

  void deleteSpot(Long spotId);

  ParkingSpotResponse occupySpot(Long spotId);

  ParkingSpotResponse releaseSpot(Long spotId);

  long countAvailableByLot(Long lotId);
}
