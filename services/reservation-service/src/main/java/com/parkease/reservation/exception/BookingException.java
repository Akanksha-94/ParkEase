package com.parkease.reservation.exception;

import org.springframework.http.HttpStatus;

public class BookingException extends RuntimeException {

    private final HttpStatus status;

    public BookingException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public BookingException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
