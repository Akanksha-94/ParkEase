package com.parkease.parkinglot.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a booking attempt is made on a lot with zero available spots.
 */
public class NoAvailableSpotsException extends ParkingLotException {

    public NoAvailableSpotsException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
