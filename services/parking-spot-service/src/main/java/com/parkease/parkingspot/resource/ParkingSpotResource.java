package com.parkease.parkingspot.resource;

import com.parkease.parkingspot.common.response.ApiResponse;
import com.parkease.parkingspot.dto.request.CreateSpotRequest;
import com.parkease.parkingspot.dto.request.UpdateSpotRequest;
import com.parkease.parkingspot.dto.response.ParkingSpotResponse;
import com.parkease.parkingspot.model.ParkingSpotType;
import com.parkease.parkingspot.model.ParkingSpotVehicleType;
import com.parkease.parkingspot.service.ParkingSpotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing parking spot management operations.
 * Base path after StripPrefix=2: /spots
 */
@RestController
@RequestMapping("/spots")
@Validated
@RequiredArgsConstructor
@Slf4j
public class ParkingSpotResource {

    private final ParkingSpotService parkingSpotService;

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> createSpot(
            @Valid @RequestBody CreateSpotRequest request) {
        log.info("POST /spots - lotId: {}, spotNum: {}", request.getLotId(), request.getSpotNumber());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Parking spot created", parkingSpotService.addSpot(request)));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> createBulkSpots(
            @RequestParam Long lotId,
            @Valid @RequestBody List<CreateSpotRequest> requests) {
        log.info("POST /spots/bulk - lotId: {}, count: {}", lotId, requests.size());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Bulk spots created", parkingSpotService.addBulkSpots(lotId, requests)));
    }

    @GetMapping("/{spotId}")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> getSpot(
            @PathVariable Long spotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Spot retrieved", parkingSpotService.getSpotById(spotId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getSpotsByLot(
            @RequestParam Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Spots retrieved", parkingSpotService.getSpotsByLot(lotId)));
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getSpotsByLotPath(
            @PathVariable Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Spots retrieved", parkingSpotService.getSpotsByLot(lotId)));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getAvailableSpots(
            @RequestParam(required = false) Long lotId) {
        List<ParkingSpotResponse> spots;
        if (lotId != null) {
            spots = parkingSpotService.getAvailableSpotsByLot(lotId);
        } else {
            spots = parkingSpotService.getAllAvailableSpots();
        }
        return ResponseEntity.ok(ApiResponse.success("Available spots retrieved", spots));
    }

    @GetMapping("/type")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getSpotsByTypeAndLot(
            @RequestParam Long lotId,
            @RequestParam ParkingSpotType spotType) {
        return ResponseEntity.ok(
                ApiResponse.success("Spots retrieved by type", parkingSpotService.getSpotsByTypeAndLot(lotId, spotType)));
    }

    @GetMapping("/vehicle-type")
    public ResponseEntity<ApiResponse<List<ParkingSpotResponse>>> getSpotsByVehicleTypeAndLot(
            @RequestParam Long lotId,
            @RequestParam ParkingSpotVehicleType vehicleType) {
        return ResponseEntity.ok(
                ApiResponse.success("Spots retrieved by vehicle type",
                        parkingSpotService.getSpotsByVehicleTypeAndLot(lotId, vehicleType)));
    }

    @PutMapping("/{spotId}")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> updateSpot(
            @PathVariable Long spotId,
            @Valid @RequestBody UpdateSpotRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Spot updated", parkingSpotService.updateSpot(spotId, request)));
    }

    @DeleteMapping("/{spotId}")
    public ResponseEntity<ApiResponse<Void>> deleteSpot(@PathVariable Long spotId) {
        parkingSpotService.deleteSpot(spotId);
        return ResponseEntity.ok(ApiResponse.success("Spot deleted", null));
    }

    @PutMapping("/{spotId}/occupy")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> occupySpot(
            @PathVariable Long spotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Spot marked as occupied", parkingSpotService.occupySpot(spotId)));
    }

    @PutMapping("/{spotId}/release")
    public ResponseEntity<ApiResponse<ParkingSpotResponse>> releaseSpot(
            @PathVariable Long spotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Spot released", parkingSpotService.releaseSpot(spotId)));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countAvailable(@RequestParam Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Available spot count", parkingSpotService.countAvailableByLot(lotId)));
    }
}
