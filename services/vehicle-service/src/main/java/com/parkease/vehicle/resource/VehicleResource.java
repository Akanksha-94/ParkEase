package com.parkease.vehicle.resource;

import com.parkease.vehicle.common.response.ApiResponse;
import com.parkease.vehicle.dto.request.RegisterVehicleRequest;
import com.parkease.vehicle.dto.request.UpdateVehicleRequest;
import com.parkease.vehicle.dto.response.VehicleResponse;
import com.parkease.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@Validated
@RequiredArgsConstructor
@Slf4j
public class VehicleResource {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> registerVehicleAlias(
            @Valid @RequestBody RegisterVehicleRequest request) {
        return registerVehicle(request);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<VehicleResponse>> registerVehicle(
            @Valid @RequestBody RegisterVehicleRequest request) {
        log.info("POST /vehicles/register - plate: {}", request.getLicensePlate());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Vehicle registered", vehicleService.registerVehicle(request)));
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleById(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(ApiResponse.success("Vehicle retrieved", vehicleService.getVehicleById(vehicleId)));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getVehiclesByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(ApiResponse.success("Vehicles retrieved", vehicleService.getVehiclesByOwner(ownerId)));
    }

    @GetMapping("/plate/{licensePlate}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getByLicensePlate(@PathVariable String licensePlate) {
        return ResponseEntity.ok(ApiResponse.success("Vehicle retrieved", vehicleService.getByLicensePlate(licensePlate)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> getAllVehicles() {
        return ResponseEntity.ok(ApiResponse.success("All vehicles retrieved", vehicleService.getAllVehicles()));
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(
            @PathVariable Long vehicleId,
            @Valid @RequestBody UpdateVehicleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Vehicle updated", vehicleService.updateVehicle(vehicleId, request)));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable Long vehicleId) {
        vehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted", null));
    }

    @GetMapping("/{vehicleId}/type")
    public ResponseEntity<ApiResponse<String>> getVehicleType(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(ApiResponse.success("Vehicle type retrieved", vehicleService.getVehicleType(vehicleId)));
    }

    @GetMapping("/{vehicleId}/ev")
    public ResponseEntity<ApiResponse<Boolean>> isEVVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(ApiResponse.success("EV status retrieved", vehicleService.isEVVehicle(vehicleId)));
    }
}
