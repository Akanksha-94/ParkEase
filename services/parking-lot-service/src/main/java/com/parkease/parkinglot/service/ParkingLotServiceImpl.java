package com.parkease.parkinglot.service;

import com.parkease.parkinglot.dto.request.CreateLotRequest;
import com.parkease.parkinglot.dto.request.UpdateLotRequest;
import com.parkease.parkinglot.dto.response.ParkingLotResponse;
import com.parkease.parkinglot.exception.LotNotFoundException;
import com.parkease.parkinglot.exception.NoAvailableSpotsException;
import com.parkease.parkinglot.model.ParkingLot;
import com.parkease.parkinglot.repository.ParkingLotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ParkingLotService}.
 *
 * <p>Handles lot lifecycle: creation (pending approval), retrieval,
 * updates, deletion, geo-proximity search, open-toggle, admin approval,
 * and atomic spot-count management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ParkingLotServiceImpl implements ParkingLotService {

    private final ParkingLotRepository parkingLotRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ParkingLotResponse createLot(CreateLotRequest request) {
        log.info("Creating new parking lot '{}' for manager {}", request.getName(), request.getManagerId());

        ParkingLot lot = ParkingLot.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .totalSpots(request.getTotalSpots())
                .availableSpots(request.getTotalSpots()) // initially all spots are available
                .hourlyRate(request.getHourlyRate())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .managerId(request.getManagerId())
                .imageUrl(request.getImageUrl())
                .isOpen(false)      // must be toggled open by manager
                .isApproved(false)  // must be approved by admin
                .build();

        ParkingLot saved = parkingLotRepository.save(lot);
        log.info("Parking lot created with ID {}", saved.getLotId());
        return toResponse(saved);
    }

    @Override
    public ParkingLotResponse getLotById(UUID lotId) {
        return toResponse(findOrThrow(lotId));
    }

    @Override
    public List<ParkingLotResponse> getLots() {
        return parkingLotRepository.findByIsApprovedTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingLotResponse> getLotsByManager(UUID managerId) {
        log.debug("Fetching lots for manager {}", managerId);
        return parkingLotRepository.findByManagerId(managerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingLotResponse> getLotsByCity(String city) {
        log.debug("Fetching approved lots in city '{}'", city);
        return parkingLotRepository.findByCityAndIsApprovedTrue(city)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ParkingLotResponse updateLot(UUID lotId, UpdateLotRequest request) {
        ParkingLot lot = findOrThrow(lotId);

        if (request.getName()       != null) lot.setName(request.getName());
        if (request.getAddress()    != null) lot.setAddress(request.getAddress());
        if (request.getCity()       != null) lot.setCity(request.getCity());
        if (request.getLatitude()   != null) lot.setLatitude(request.getLatitude());
        if (request.getLongitude()  != null) lot.setLongitude(request.getLongitude());
        if (request.getHourlyRate() != null) lot.setHourlyRate(request.getHourlyRate());
        if (request.getOpenTime()   != null) lot.setOpenTime(request.getOpenTime());
        if (request.getCloseTime()  != null) lot.setCloseTime(request.getCloseTime());
        if (request.getImageUrl()   != null) lot.setImageUrl(request.getImageUrl());
        if (request.getIsOpen()     != null) lot.setOpen(request.getIsOpen());

        if (request.getTotalSpots() != null) {
            int delta = request.getTotalSpots() - lot.getTotalSpots();
            lot.setTotalSpots(request.getTotalSpots());
            // Adjust available spots proportionally
            int newAvailable = Math.max(0, lot.getAvailableSpots() + delta);
            lot.setAvailableSpots(newAvailable);
        }

        log.info("Updated parking lot {}", lotId);
        return toResponse(parkingLotRepository.save(lot));
    }

    @Override
    @Transactional
    public void deleteLot(UUID lotId) {
        ParkingLot lot = findOrThrow(lotId);
        parkingLotRepository.delete(lot);
        log.info("Deleted parking lot {}", lotId);
    }

    // ── Geo-Proximity ─────────────────────────────────────────────────────────

    @Override
    public List<ParkingLotResponse> getNearbyLots(double latitude, double longitude, double radiusKm) {
        log.debug("Geo search: lat={}, lng={}, radius={}km", latitude, longitude, radiusKm);
        return parkingLotRepository.findNearby(latitude, longitude, radiusKm)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParkingLotResponse> searchLots(String keyword) {
        String kw = keyword == null ? "" : keyword.toLowerCase().trim();
        log.debug("Searching lots with keyword '{}'", kw);
        return parkingLotRepository.findByIsApprovedTrue()
                .stream()
                .filter(lot ->
                        lot.getName().toLowerCase().contains(kw) ||
                        lot.getAddress().toLowerCase().contains(kw) ||
                        lot.getCity().toLowerCase().contains(kw))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Toggle / Approval ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public ParkingLotResponse toggleOpen(UUID lotId) {
        ParkingLot lot = findOrThrow(lotId);
        lot.setOpen(!lot.isOpen());
        log.info("Lot {} toggled to isOpen={}", lotId, lot.isOpen());
        return toResponse(parkingLotRepository.save(lot));
    }

    @Override
    @Transactional
    public ParkingLotResponse approveLot(UUID lotId) {
        ParkingLot lot = findOrThrow(lotId);
        lot.setApproved(true);
        log.info("Admin approved lot {}", lotId);
        return toResponse(parkingLotRepository.save(lot));
    }

    // ── Available Spot Counters ───────────────────────────────────────────────

    @Override
    @Transactional
    public void decrementAvailable(UUID lotId) {
        ParkingLot lot = findOrThrow(lotId);
        if (lot.getAvailableSpots() <= 0) {
            throw new NoAvailableSpotsException("No available spots in lot " + lotId);
        }
        lot.setAvailableSpots(lot.getAvailableSpots() - 1);
        parkingLotRepository.save(lot);
        log.debug("Decremented available spots for lot {}: now {}", lotId, lot.getAvailableSpots());
    }

    @Override
    @Transactional
    public void incrementAvailable(UUID lotId) {
        ParkingLot lot = findOrThrow(lotId);
        if (lot.getAvailableSpots() < lot.getTotalSpots()) {
            lot.setAvailableSpots(lot.getAvailableSpots() + 1);
            parkingLotRepository.save(lot);
            log.debug("Incremented available spots for lot {}: now {}", lotId, lot.getAvailableSpots());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ParkingLot findOrThrow(UUID lotId) {
        return parkingLotRepository.findById(lotId)
                .orElseThrow(() -> new LotNotFoundException("Parking lot not found with ID: " + lotId));
    }

    private ParkingLotResponse toResponse(ParkingLot lot) {
        return ParkingLotResponse.builder()
                .lotId(lot.getLotId())
                .name(lot.getName())
                .address(lot.getAddress())
                .city(lot.getCity())
                .latitude(lot.getLatitude())
                .longitude(lot.getLongitude())
                .totalSpots(lot.getTotalSpots())
                .availableSpots(lot.getAvailableSpots())
                .hourlyRate(lot.getHourlyRate())
                .openTime(lot.getOpenTime())
                .closeTime(lot.getCloseTime())
                .managerId(lot.getManagerId())
                .isOpen(lot.isOpen())
                .isApproved(lot.isApproved())
                .imageUrl(lot.getImageUrl())
                .createdAt(lot.getCreatedAt())
                .updatedAt(lot.getUpdatedAt())
                .build();
    }
}
