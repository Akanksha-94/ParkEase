package com.parkease.vehicle.exception;

import org.springframework.http.HttpStatus;

public class VehicleException extends RuntimeException {

    private final HttpStatus status;

    public VehicleException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public VehicleException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
