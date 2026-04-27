package com.parkease.parkingspot.resource;

import com.parkease.parkingspot.dto.request.CreateSpotRequest;
import com.parkease.parkingspot.dto.request.UpdateSpotRequest;
import com.parkease.parkingspot.dto.response.ParkingSpotResponse;
import com.parkease.parkingspot.service.ParkingSpotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/spots")
@Validated
@RequiredArgsConstructor
public class ParkingSpotResource {

  private final ParkingSpotService parkingSpotService;

  @PostMapping
  public ResponseEntity<ParkingSpotResponse> createSpot(@Valid @RequestBody CreateSpotRequest request) {
    return ResponseEntity.ok(parkingSpotService.addSpot(request));
  }

  @PostMapping("/bulk")
  public ResponseEntity<List<ParkingSpotResponse>> createBulkSpots(
      @RequestParam UUID lotId,
      @Valid @RequestBody List<CreateSpotRequest> requests) {
    return ResponseEntity.ok(parkingSpotService.addBulkSpots(lotId, requests));
  }

  @GetMapping("/{spotId}")
  public ResponseEntity<ParkingSpotResponse> getSpot(@PathVariable UUID spotId) {
    return ResponseEntity.ok(parkingSpotService.getSpotById(spotId));
  }

  @GetMapping
  public ResponseEntity<List<ParkingSpotResponse>> getSpotsByLot(@RequestParam UUID lotId) {
    return ResponseEntity.ok(parkingSpotService.getSpotsByLot(lotId));
  }

  @GetMapping("/available")
  public ResponseEntity<List<ParkingSpotResponse>> getAvailableSpots(@RequestParam UUID lotId) {
    return ResponseEntity.ok(parkingSpotService.getAvailableSpotsByLot(lotId));
  }

  @GetMapping("/type")
  public ResponseEntity<List<ParkingSpotResponse>> getSpotsByTypeAndLot(
      @RequestParam UUID lotId,
      @RequestParam com.parkease.parkingspot.model.ParkingSpotType spotType) {
    return ResponseEntity.ok(parkingSpotService.getSpotsByTypeAndLot(lotId, spotType));
  }

  @GetMapping("/vehicle-type")
  public ResponseEntity<List<ParkingSpotResponse>> getSpotsByVehicleTypeAndLot(
      @RequestParam UUID lotId,
      @RequestParam com.parkease.parkingspot.model.ParkingSpotVehicleType vehicleType) {
    return ResponseEntity.ok(parkingSpotService.getSpotsByVehicleTypeAndLot(lotId, vehicleType));
  }


  @PutMapping("/{spotId}")
  public ResponseEntity<ParkingSpotResponse> updateSpot(
      @PathVariable UUID spotId,
      @Valid @RequestBody UpdateSpotRequest request) {
    return ResponseEntity.ok(parkingSpotService.updateSpot(spotId, request));
  }

  @DeleteMapping("/{spotId}")
  public ResponseEntity<Void> deleteSpot(@PathVariable UUID spotId) {
    parkingSpotService.deleteSpot(spotId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{spotId}/occupy")
  public ResponseEntity<ParkingSpotResponse> occupySpot(@PathVariable UUID spotId) {
    return ResponseEntity.ok(parkingSpotService.occupySpot(spotId));
  }

  @PutMapping("/{spotId}/release")
  public ResponseEntity<ParkingSpotResponse> releaseSpot(@PathVariable UUID spotId) {
    return ResponseEntity.ok(parkingSpotService.releaseSpot(spotId));
  }

  @GetMapping("/count")
  public ResponseEntity<Long> countAvailable(@RequestParam UUID lotId) {
    return ResponseEntity.ok(parkingSpotService.countAvailableByLot(lotId));
  }
}
