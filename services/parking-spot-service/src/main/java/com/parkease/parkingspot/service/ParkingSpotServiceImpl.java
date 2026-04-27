package com.parkease.parkingspot.service;

import com.parkease.parkingspot.dto.request.CreateSpotRequest;
import com.parkease.parkingspot.dto.request.UpdateSpotRequest;
import com.parkease.parkingspot.dto.response.ParkingSpotResponse;
import com.parkease.parkingspot.exception.ParkingSpotException;
import com.parkease.parkingspot.exception.SpotNotFoundException;
import com.parkease.parkingspot.model.ParkingSpot;
import com.parkease.parkingspot.model.ParkingSpotStatus;
import com.parkease.parkingspot.repository.ParkingSpotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ParkingSpotServiceImpl implements ParkingSpotService {

  private final ParkingSpotRepository parkingSpotRepository;

  @Override
  @Transactional
  public ParkingSpotResponse addSpot(CreateSpotRequest request) {
    ParkingSpot spot = ParkingSpot.builder()
        .lotId(request.getLotId())
        .spotNumber(request.getSpotNumber())
        .floor(request.getFloor())
        .spotType(request.getSpotType())
        .vehicleType(request.getVehicleType())
        .status(ParkingSpotStatus.AVAILABLE)
        .handicapped(request.isHandicapped())
        .evCharging(request.isEvCharging())
        .pricePerHour(request.getPricePerHour())
        .build();

    ParkingSpot saved = parkingSpotRepository.save(spot);
    log.info("Created parking spot {} for lot {}", saved.getSpotId(), saved.getLotId());
    return toResponse(saved);
  }

  @Override
  @Transactional
  public List<ParkingSpotResponse> addBulkSpots(UUID lotId, List<CreateSpotRequest> requests) {
    List<ParkingSpot> spots = requests.stream()
        .map(request -> ParkingSpot.builder()
            .lotId(lotId)
            .spotNumber(request.getSpotNumber())
            .floor(request.getFloor())
            .spotType(request.getSpotType())
            .vehicleType(request.getVehicleType())
            .status(ParkingSpotStatus.AVAILABLE)
            .handicapped(request.isHandicapped())
            .evCharging(request.isEvCharging())
            .pricePerHour(request.getPricePerHour())
            .build())
        .collect(Collectors.toList());

    return parkingSpotRepository.saveAll(spots).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  public ParkingSpotResponse getSpotById(UUID spotId) {
    return toResponse(findOrThrow(spotId));
  }

  @Override
  public List<ParkingSpotResponse> getSpotsByLot(UUID lotId) {
    return parkingSpotRepository.findByLotId(lotId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  public List<ParkingSpotResponse> getAvailableSpotsByLot(UUID lotId) {
    return parkingSpotRepository.findByLotIdAndStatus(lotId, ParkingSpotStatus.AVAILABLE).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  public List<ParkingSpotResponse> getSpotsByTypeAndLot(UUID lotId, com.parkease.parkingspot.model.ParkingSpotType spotType) {
    return parkingSpotRepository.findByLotIdAndSpotType(lotId, spotType).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Override
  public List<ParkingSpotResponse> getSpotsByVehicleTypeAndLot(UUID lotId, com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType) {
    return parkingSpotRepository.findByLotIdAndVehicleType(lotId, vehicleType).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }


  @Override
  @Transactional
  public ParkingSpotResponse updateSpot(UUID spotId, UpdateSpotRequest request) {
    ParkingSpot spot = findOrThrow(spotId);

    if (request.getSpotNumber() != null)
      spot.setSpotNumber(request.getSpotNumber());
    if (request.getFloor() != null)
      spot.setFloor(request.getFloor());
    if (request.getSpotType() != null)
      spot.setSpotType(request.getSpotType());
    if (request.getVehicleType() != null)
      spot.setVehicleType(request.getVehicleType());
    if (request.getStatus() != null)
      spot.setStatus(request.getStatus());
    if (request.getPricePerHour() != null)
      spot.setPricePerHour(request.getPricePerHour());
    if (request.getHandicapped() != null)
      spot.setHandicapped(request.getHandicapped());
    if (request.getEvCharging() != null)
      spot.setEvCharging(request.getEvCharging());

    return toResponse(parkingSpotRepository.save(spot));
  }

  @Override
  @Transactional
  public void deleteSpot(UUID spotId) {
    ParkingSpot spot = findOrThrow(spotId);
    parkingSpotRepository.delete(spot);
    log.info("Deleted parking spot {}", spotId);
  }

  @Override
  @Transactional
  public ParkingSpotResponse occupySpot(UUID spotId) {
    ParkingSpot spot = findOrThrow(spotId);
    if (spot.getStatus() != ParkingSpotStatus.AVAILABLE) {
      throw new ParkingSpotException("Only available spots can be occupied.");
    }
    spot.setStatus(ParkingSpotStatus.OCCUPIED);
    return toResponse(parkingSpotRepository.save(spot));
  }

  @Override
  @Transactional
  public ParkingSpotResponse releaseSpot(UUID spotId) {
    ParkingSpot spot = findOrThrow(spotId);
    if (spot.getStatus() == ParkingSpotStatus.AVAILABLE) {
      throw new ParkingSpotException("Spot is already available.");
    }
    spot.setStatus(ParkingSpotStatus.AVAILABLE);
    return toResponse(parkingSpotRepository.save(spot));
  }

  @Override
  public long countAvailableByLot(UUID lotId) {
    return parkingSpotRepository.countByLotIdAndStatus(lotId, ParkingSpotStatus.AVAILABLE);
  }

  private ParkingSpot findOrThrow(UUID spotId) {
    return parkingSpotRepository.findById(spotId)
        .orElseThrow(() -> new SpotNotFoundException("Parking spot not found: " + spotId));
  }

  private ParkingSpotResponse toResponse(ParkingSpot spot) {
    return ParkingSpotResponse.builder()
        .spotId(spot.getSpotId())
        .lotId(spot.getLotId())
        .spotNumber(spot.getSpotNumber())
        .floor(spot.getFloor())
        .spotType(spot.getSpotType())
        .vehicleType(spot.getVehicleType())
        .status(spot.getStatus())
        .handicapped(spot.isHandicapped())
        .evCharging(spot.isEvCharging())
        .pricePerHour(spot.getPricePerHour())
        .createdAt(spot.getCreatedAt())
        .updatedAt(spot.getUpdatedAt())
        .build();
  }
}
