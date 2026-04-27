package com.parkease.parkinglot.resource;

import com.parkease.parkinglot.dto.request.CreateLotRequest;
import com.parkease.parkinglot.dto.request.UpdateLotRequest;
import com.parkease.parkinglot.dto.response.ParkingLotResponse;
import com.parkease.parkinglot.service.ParkingLotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller exposing parking lot management operations.
 */
@RestController
@RequestMapping("/api/lots")
@Validated
@RequiredArgsConstructor
public class ParkingLotResource {

  private final ParkingLotService parkingLotService;

  @PostMapping
  public ResponseEntity<ParkingLotResponse> createLot(@Valid @RequestBody CreateLotRequest request) {
    ParkingLotResponse response = parkingLotService.createLot(request);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{lotId}")
  public ResponseEntity<ParkingLotResponse> getLotById(@PathVariable UUID lotId) {
    return ResponseEntity.ok(parkingLotService.getLotById(lotId));
  }

  @GetMapping
  public ResponseEntity<List<ParkingLotResponse>> getLots(
      @RequestParam(value = "city", required = false) String city,
      @RequestParam(value = "managerId", required = false) UUID managerId,
      @RequestParam(value = "keyword", required = false) String keyword,
      @RequestParam(value = "latitude", required = false) Double latitude,
      @RequestParam(value = "longitude", required = false) Double longitude,
      @RequestParam(value = "radiusKm", required = false) Double radiusKm) {

    if (latitude != null && longitude != null && radiusKm != null) {
      return ResponseEntity.ok(parkingLotService.getNearbyLots(latitude, longitude, radiusKm));
    }
    if (keyword != null && !keyword.isBlank()) {
      return ResponseEntity.ok(parkingLotService.searchLots(keyword));
    }
    if (managerId != null) {
      return ResponseEntity.ok(parkingLotService.getLotsByManager(managerId));
    }
    if (city != null && !city.isBlank()) {
      return ResponseEntity.ok(parkingLotService.getLotsByCity(city));
    }
    return ResponseEntity.ok(parkingLotService.getLots());
  }

  @PatchMapping("/{lotId}")
  public ResponseEntity<ParkingLotResponse> updateLot(
      @PathVariable UUID lotId,
      @Valid @RequestBody UpdateLotRequest request) {
    return ResponseEntity.ok(parkingLotService.updateLot(lotId, request));
  }

  @DeleteMapping("/{lotId}")
  public ResponseEntity<Void> deleteLot(@PathVariable UUID lotId) {
    parkingLotService.deleteLot(lotId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{lotId}/toggle-open")
  public ResponseEntity<ParkingLotResponse> toggleOpen(@PathVariable UUID lotId) {
    return ResponseEntity.ok(parkingLotService.toggleOpen(lotId));
  }

  @PostMapping("/{lotId}/approve")
  public ResponseEntity<ParkingLotResponse> approveLot(@PathVariable UUID lotId) {
    return ResponseEntity.ok(parkingLotService.approveLot(lotId));
  }

  @PostMapping("/{lotId}/decrement")
  public ResponseEntity<Void> decrementAvailable(@PathVariable UUID lotId) {
    parkingLotService.decrementAvailable(lotId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{lotId}/increment")
  public ResponseEntity<Void> incrementAvailable(@PathVariable UUID lotId) {
    parkingLotService.incrementAvailable(lotId);
    return ResponseEntity.noContent().build();
  }
}
