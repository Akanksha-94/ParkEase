package com.parkease.vehicle.resource;

import com.parkease.vehicle.dto.request.RegisterVehicleRequest;
import com.parkease.vehicle.dto.request.UpdateVehicleRequest;
import com.parkease.vehicle.dto.response.VehicleResponse;
import com.parkease.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles")
@Validated
@RequiredArgsConstructor
public class VehicleResource {

    private final VehicleService vehicleService;

    @PostMapping("/register")
    public ResponseEntity<VehicleResponse> registerVehicle(@Valid @RequestBody RegisterVehicleRequest request) {
        return ResponseEntity.ok(vehicleService.registerVehicle(request));
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<VehicleResponse>> getVehiclesByOwner(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByOwner(ownerId));
    }

    @GetMapping("/plate/{licensePlate}")
    public ResponseEntity<VehicleResponse> getByLicensePlate(@PathVariable String licensePlate) {
        return ResponseEntity.ok(vehicleService.getByLicensePlate(licensePlate));
    }

    @GetMapping("/all")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody UpdateVehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(vehicleId, request));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID vehicleId) {
        vehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{vehicleId}/type")
    public ResponseEntity<String> getVehicleType(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleType(vehicleId));
    }

    @GetMapping("/{vehicleId}/ev")
    public ResponseEntity<Boolean> isEVVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(vehicleService.isEVVehicle(vehicleId));
    }
}
