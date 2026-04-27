package com.parkease.vehicle.service;

import com.parkease.vehicle.dto.request.RegisterVehicleRequest;
import com.parkease.vehicle.dto.request.UpdateVehicleRequest;
import com.parkease.vehicle.dto.response.VehicleResponse;

import java.util.List;
import java.util.UUID;

public interface VehicleService {

    VehicleResponse registerVehicle(RegisterVehicleRequest request);

    VehicleResponse getVehicleById(UUID vehicleId);

    List<VehicleResponse> getVehiclesByOwner(UUID ownerId);

    VehicleResponse getByLicensePlate(String licensePlate);

    VehicleResponse updateVehicle(UUID vehicleId, UpdateVehicleRequest request);

    void deleteVehicle(UUID vehicleId);

    String getVehicleType(UUID vehicleId);

    boolean isEVVehicle(UUID vehicleId);

    List<VehicleResponse> getAllVehicles();
}
