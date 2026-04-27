package com.parkease.vehicle.repository;

import com.parkease.vehicle.model.Vehicle;
import com.parkease.vehicle.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findByOwnerId(UUID ownerId);

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    List<Vehicle> findByVehicleType(VehicleType vehicleType);

    List<Vehicle> findByEvTrue();

    boolean existsByLicensePlate(String licensePlate);
}
