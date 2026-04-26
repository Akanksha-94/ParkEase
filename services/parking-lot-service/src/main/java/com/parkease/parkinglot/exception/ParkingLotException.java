package com.parkease.parkinglot.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for domain-specific exceptions in parking-lot-service.
 */
public abstract class ParkingLotException extends RuntimeException {

    private final HttpStatus status;

    protected ParkingLotException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
