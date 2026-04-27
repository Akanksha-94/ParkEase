package com.parkease.parkingspot.service;

import com.parkease.parkingspot.dto.request.CreateSpotRequest;
import com.parkease.parkingspot.dto.request.UpdateSpotRequest;
import com.parkease.parkingspot.dto.response.ParkingSpotResponse;

import java.util.List;
import java.util.UUID;

public interface ParkingSpotService {

  ParkingSpotResponse addSpot(CreateSpotRequest request);

  List<ParkingSpotResponse> addBulkSpots(UUID lotId, List<CreateSpotRequest> requests);

  ParkingSpotResponse getSpotById(UUID spotId);

  List<ParkingSpotResponse> getSpotsByLot(UUID lotId);

  List<ParkingSpotResponse> getAvailableSpotsByLot(UUID lotId);

  List<ParkingSpotResponse> getSpotsByTypeAndLot(UUID lotId, com.parkease.parkingspot.model.ParkingSpotType spotType);

  List<ParkingSpotResponse> getSpotsByVehicleTypeAndLot(UUID lotId, com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType);


  ParkingSpotResponse updateSpot(UUID spotId, UpdateSpotRequest request);

  void deleteSpot(UUID spotId);

  ParkingSpotResponse occupySpot(UUID spotId);

  ParkingSpotResponse releaseSpot(UUID spotId);

  long countAvailableByLot(UUID lotId);
}
