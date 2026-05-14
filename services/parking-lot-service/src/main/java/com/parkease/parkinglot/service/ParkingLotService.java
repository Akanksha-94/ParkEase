package com.parkease.parkinglot.service;

import com.parkease.parkinglot.dto.request.CreateLotRequest;
import com.parkease.parkinglot.dto.request.UpdateLotRequest;
import com.parkease.parkinglot.dto.response.ParkingLotResponse;

import java.util.List;


/**
 * Service interface for parking lot management operations.
 *
 * <p>Declares all lot CRUD, geo-proximity search, open-toggle,
 * approval, and available count management operations.
 */
public interface ParkingLotService {

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /**
     * Create a new parking lot (submitted by a manager, pending admin approval).
     */
    ParkingLotResponse createLot(CreateLotRequest request);

    /**
     * Retrieve a single lot by its ID.
     */
    ParkingLotResponse getLotById(Long lotId);

    /**
     * Retrieve all lots visible to drivers (approved only).
     */
    List<ParkingLotResponse> getLots();

    /**
     * Retrieve all lots managed by a specific manager.
     */
    List<ParkingLotResponse> getLotsByManager(Long managerId);

    /**
     * Retrieve all approved lots in a given city.
     */
    List<ParkingLotResponse> getLotsByCity(String city);

    /**
     * Update mutable fields of a parking lot (manager or admin).
     */
    ParkingLotResponse updateLot(Long lotId, UpdateLotRequest request);

    /**
     * Permanently delete a parking lot.
     */
    void deleteLot(Long lotId);

    // ── Geo-Proximity ─────────────────────────────────────────────────────────

    /**
     * Find all approved lots within a given radius (km) of a coordinate.
     */
    List<ParkingLotResponse> getNearbyLots(double latitude, double longitude, double radiusKm);

    /**
     * Full-text search across name, address, and city of approved lots.
     */
    List<ParkingLotResponse> searchLots(String keyword);

    // ── Toggle / Approval ─────────────────────────────────────────────────────

    /**
     * Toggle the open/closed state of a lot (manager action).
     */
    ParkingLotResponse toggleOpen(Long lotId);

    /**
     * Admin approves a pending lot, making it searchable by drivers.
     */
    ParkingLotResponse approveLot(Long lotId);

    // ── Available Spot Counters ───────────────────────────────────────────────

    /**
     * Decrement available spots atomically (called on booking confirmation).
     */
    void decrementAvailable(Long lotId);

    /**
     * Increment available spots atomically (called on checkout or cancellation).
     */
    void incrementAvailable(Long lotId);
}
