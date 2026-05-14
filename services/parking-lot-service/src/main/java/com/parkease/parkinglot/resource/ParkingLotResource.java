package com.parkease.parkinglot.resource;

import com.parkease.parkinglot.common.response.ApiResponse;
import com.parkease.parkinglot.dto.request.CreateLotRequest;
import com.parkease.parkinglot.dto.request.UpdateLotRequest;
import com.parkease.parkinglot.dto.response.ParkingLotResponse;
import com.parkease.parkinglot.service.ParkingLotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing parking lot management operations.
 * Base path after StripPrefix=2: /lots
 */
@RestController
@RequestMapping("/lots")
@Validated
@RequiredArgsConstructor
@Slf4j
public class ParkingLotResource {

    private final ParkingLotService parkingLotService;

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingLotResponse>> createLot(
            @Valid @RequestBody CreateLotRequest request) {
        log.info("POST /lots - name: {}", request.getName());
        ParkingLotResponse response = parkingLotService.createLot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Parking lot created successfully", response));
    }

    @GetMapping("/{lotId}")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> getLotById(
            @PathVariable Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Parking lot retrieved", parkingLotService.getLotById(lotId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParkingLotResponse>>> getLots(
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "managerId", required = false) Long managerId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "radiusKm", required = false) Double radiusKm) {

        List<ParkingLotResponse> result;
        if (latitude != null && longitude != null && radiusKm != null) {
            result = parkingLotService.getNearbyLots(latitude, longitude, radiusKm);
        } else if (keyword != null && !keyword.isBlank()) {
            result = parkingLotService.searchLots(keyword);
        } else if (managerId != null) {
            result = parkingLotService.getLotsByManager(managerId);
        } else if (city != null && !city.isBlank()) {
            result = parkingLotService.getLotsByCity(city);
        } else {
            result = parkingLotService.getLots();
        }
        return ResponseEntity.ok(ApiResponse.success("Parking lots retrieved", result));
    }

    @PatchMapping("/{lotId}")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> updateLot(
            @PathVariable Long lotId,
            @Valid @RequestBody UpdateLotRequest request) {
        log.info("PATCH /lots/{} - updating fields", lotId);
        return ResponseEntity.ok(
                ApiResponse.success("Parking lot updated", parkingLotService.updateLot(lotId, request)));
    }

    @DeleteMapping("/{lotId}")
    public ResponseEntity<ApiResponse<Void>> deleteLot(@PathVariable Long lotId) {
        parkingLotService.deleteLot(lotId);
        return ResponseEntity.ok(ApiResponse.success("Parking lot deleted", null));
    }

    @PostMapping("/{lotId}/toggle-open")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> toggleOpen(
            @PathVariable Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Parking lot status toggled", parkingLotService.toggleOpen(lotId)));
    }

    @PostMapping("/{lotId}/approve")
    public ResponseEntity<ApiResponse<ParkingLotResponse>> approveLot(
            @PathVariable Long lotId) {
        return ResponseEntity.ok(
                ApiResponse.success("Parking lot approved", parkingLotService.approveLot(lotId)));
    }

    @PostMapping("/{lotId}/decrement")
    public ResponseEntity<ApiResponse<Void>> decrementAvailable(@PathVariable Long lotId) {
        parkingLotService.decrementAvailable(lotId);
        return ResponseEntity.ok(ApiResponse.success("Available spots decremented", null));
    }

    @PostMapping("/{lotId}/increment")
    public ResponseEntity<ApiResponse<Void>> incrementAvailable(@PathVariable Long lotId) {
        parkingLotService.incrementAvailable(lotId);
        return ResponseEntity.ok(ApiResponse.success("Available spots incremented", null));
    }
}
