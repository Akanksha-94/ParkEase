package com.parkease.vehicle.service;

import com.parkease.vehicle.dto.request.RegisterVehicleRequest;
import com.parkease.vehicle.dto.request.UpdateVehicleRequest;
import com.parkease.vehicle.dto.response.VehicleResponse;

import java.util.List;


public interface VehicleService {

    VehicleResponse registerVehicle(RegisterVehicleRequest request);

    VehicleResponse getVehicleById(Long vehicleId);

    List<VehicleResponse> getVehiclesByOwner(Long ownerId);

    VehicleResponse getByLicensePlate(String licensePlate);

    VehicleResponse updateVehicle(Long vehicleId, UpdateVehicleRequest request);

    void deleteVehicle(Long vehicleId);

    String getVehicleType(Long vehicleId);

    boolean isEVVehicle(Long vehicleId);

    List<VehicleResponse> getAllVehicles();
}
