package com.parkease.vehicle.service;

import com.parkease.vehicle.dto.request.RegisterVehicleRequest;
import com.parkease.vehicle.dto.request.UpdateVehicleRequest;
import com.parkease.vehicle.dto.response.VehicleResponse;
import com.parkease.vehicle.exception.VehicleException;
import com.parkease.vehicle.exception.VehicleNotFoundException;
import com.parkease.vehicle.model.Vehicle;
import com.parkease.vehicle.repository.VehicleRepository;
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
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional
    public VehicleResponse registerVehicle(RegisterVehicleRequest request) {
        log.info("Registering vehicle with plate {}", request.getLicensePlate());

        if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new VehicleException("Vehicle with license plate " + request.getLicensePlate() + " already exists.");
        }

        Vehicle vehicle = Vehicle.builder()
                .ownerId(request.getOwnerId())
                .licensePlate(request.getLicensePlate())
                .make(request.getMake())
                .model(request.getModel())
                .color(request.getColor())
                .vehicleType(request.getVehicleType())
                .ev(request.isEv())
                .build();

        return toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    public VehicleResponse getVehicleById(UUID vehicleId) {
        return toResponse(findOrThrow(vehicleId));
    }

    @Override
    public List<VehicleResponse> getVehiclesByOwner(UUID ownerId) {
        return vehicleRepository.findByOwnerId(ownerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleResponse getByLicensePlate(String licensePlate) {
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with plate: " + licensePlate));
        return toResponse(vehicle);
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicle(UUID vehicleId, UpdateVehicleRequest request) {
        Vehicle vehicle = findOrThrow(vehicleId);

        if (request.getMake() != null) vehicle.setMake(request.getMake());
        if (request.getModel() != null) vehicle.setModel(request.getModel());
        if (request.getColor() != null) vehicle.setColor(request.getColor());
        if (request.getVehicleType() != null) vehicle.setVehicleType(request.getVehicleType());
        if (request.getEv() != null) vehicle.setEv(request.getEv());
        if (request.getActive() != null) vehicle.setActive(request.getActive());

        return toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional
    public void deleteVehicle(UUID vehicleId) {
        Vehicle vehicle = findOrThrow(vehicleId);
        vehicleRepository.delete(vehicle);
        log.info("Deleted vehicle {}", vehicleId);
    }

    @Override
    public String getVehicleType(UUID vehicleId) {
        return findOrThrow(vehicleId).getVehicleType().name();
    }

    @Override
    public boolean isEVVehicle(UUID vehicleId) {
        return findOrThrow(vehicleId).isEv();
    }

    @Override
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Vehicle findOrThrow(UUID vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found: " + vehicleId));
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return VehicleResponse.builder()
                .vehicleId(vehicle.getVehicleId())
                .ownerId(vehicle.getOwnerId())
                .licensePlate(vehicle.getLicensePlate())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .color(vehicle.getColor())
                .vehicleType(vehicle.getVehicleType())
                .ev(vehicle.isEv())
                .active(vehicle.isActive())
                .registeredAt(vehicle.getRegisteredAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
