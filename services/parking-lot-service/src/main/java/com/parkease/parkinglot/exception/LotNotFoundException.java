package com.parkease.parkinglot.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a parking lot is not found by ID or other criteria.
 */
public class LotNotFoundException extends ParkingLotException {

    public LotNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
