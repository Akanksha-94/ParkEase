package com.parkease.vehicle.dto.request;

import com.parkease.vehicle.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVehicleRequest {

    private String make;
    private String model;
    private String color;
    private VehicleType vehicleType;
    private Boolean ev;
    private Boolean active;
}
