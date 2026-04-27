package com.parkease.vehicle.exception;

import org.springframework.http.HttpStatus;

public class VehicleNotFoundException extends VehicleException {

    public VehicleNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
