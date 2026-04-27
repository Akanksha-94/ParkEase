package com.parkease.reservation.exception;

import org.springframework.http.HttpStatus;

public class BookingNotFoundException extends BookingException {

    public BookingNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
