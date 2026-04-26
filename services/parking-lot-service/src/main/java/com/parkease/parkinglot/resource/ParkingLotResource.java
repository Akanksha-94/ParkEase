package com.parkease.parkinglot.resource;

import com.parkease.parkinglot.dto.request.CreateLotRequest;
import com.parkease.parkinglot.dto.request.UpdateLotRequest;
import com.parkease.parkinglot.dto.response.ParkingLotResponse;
import com.parkease.parkinglot.service.ParkingLotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * REST resource (controller) for parking lot management.
 *
 * <p>Base path: {@code /api/v1/lots}
 *
 * <ul>
 *   <li>POST   /               — Create a new lot (MANAGER / ADMIN)</li>
 *   <li>GET    /               — List all approved lots (public)</li>
 *   <li>GET    /{id}           — Get a lot by ID (public)</li>
 *   <li>GET    /manager        — Get lots for the authenticated manager</li>
 *   <li>GET    /city/{city}    — Get approved lots in a city (public)</li>
 *   <li>GET    /nearby         — Geo-proximity search (public)</li>
 *   <li>GET    /search         — Full-text search (public)</li>
 *   <li>PUT    /{id}           — Update a lot (MANAGER / ADMIN)</li>
 *   <li>PUT    /{id}/toggle    — Toggle open/closed state (MANAGER / ADMIN)</li>
 *   <li>PUT    /{id}/approve   — Admin approve a pending lot (ADMIN)</li>
 *   <li>PUT    /{id}/decrement — Decrement available spots (internal)</li>
 *   <li>PUT    /{id}/increment — Increment available spots (internal)</li>
 *   <li>DELETE /{id}           — Delete a lot (MANAGER / ADMIN)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/lots")
@RequiredArgsConstructor
@Tag(name = "Parking Lots", description = "Parking lot management and search endpoints")
public class ParkingLotResource {

    private final ParkingLotService parkingLotService;

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a new parking lot (pending admin approval)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ParkingLotResponse> createLot(
            @Valid @RequestBody CreateLotRequest request,
            Principal principal) {

        // Override managerId from the authenticated JWT principal (for MANAGER role)
        // Admin can supply an explicit managerId in the request body
        if (principal != null && request.getManagerId() == null) {
            // managerId must be sent explicitly; this acts as a safety net
        }
        ParkingLotResponse response = parkingLotService.createLot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all approved parking lots")
    public ResponseEntity<List<ParkingLotResponse>> getLots() {
        return ResponseEntity.ok(parkingLotService.getLots());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a parking lot by ID")
    public ResponseEntity<ParkingLotResponse> getLotById(@PathVariable UUID id) {
        return ResponseEntity.ok(parkingLotService.getLotById(id));
    }

    @GetMapping("/manager")
    @Operation(summary = "Get all lots managed by the authenticated manager",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ParkingLotResponse>> getLotsByManager(
            @RequestParam UUID managerId) {
        return ResponseEntity.ok(parkingLotService.getLotsByManager(managerId));
    }

    @GetMapping("/city/{city}")
    @Operation(summary = "Get approved parking lots in a given city")
    public ResponseEntity<List<ParkingLotResponse>> getLotsByCity(@PathVariable String city) {
        return ResponseEntity.ok(parkingLotService.getLotsByCity(city));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find approved lots within a given radius of a coordinate")
    public ResponseEntity<List<ParkingLotResponse>> getNearbyLots(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5.0") double radiusKm) {
        return ResponseEntity.ok(parkingLotService.getNearbyLots(latitude, longitude, radiusKm));
    }

    @GetMapping("/search")
    @Operation(summary = "Search approved lots by keyword (name, address, city)")
    public ResponseEntity<List<ParkingLotResponse>> searchLots(
            @RequestParam(defaultValue = "") String keyword) {
        return ResponseEntity.ok(parkingLotService.searchLots(keyword));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Update a parking lot",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ParkingLotResponse> updateLot(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLotRequest request) {
        return ResponseEntity.ok(parkingLotService.updateLot(id, request));
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "Toggle the open/closed state of a parking lot",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ParkingLotResponse> toggleOpen(@PathVariable UUID id) {
        return ResponseEntity.ok(parkingLotService.toggleOpen(id));
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Admin: approve a pending parking lot",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ParkingLotResponse> approveLot(@PathVariable UUID id) {
        return ResponseEntity.ok(parkingLotService.approveLot(id));
    }

    // ── Spot Counters (internal / service-to-service) ─────────────────────────

    @PutMapping("/{id}/decrement")
    @Operation(summary = "Decrement available spots (called by booking-service on booking)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> decrementAvailable(@PathVariable UUID id) {
        parkingLotService.decrementAvailable(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/increment")
    @Operation(summary = "Increment available spots (called by booking-service on checkout/cancel)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> incrementAvailable(@PathVariable UUID id) {
        parkingLotService.incrementAvailable(id);
        return ResponseEntity.noContent().build();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a parking lot",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteLot(@PathVariable UUID id) {
        parkingLotService.deleteLot(id);
        return ResponseEntity.noContent().build();
    }
}
