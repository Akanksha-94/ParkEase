package com.parkease.vehicle.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parkease.vehicle.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponse {

    private Long vehicleId;
    private Long ownerId;
    private String licensePlate;
    private String make;
    private String model;
    private String color;
    private VehicleType vehicleType;
    private boolean ev;
    private boolean active;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime registeredAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
