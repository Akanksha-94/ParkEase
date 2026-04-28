package com.parkease.notification.exception;

import org.springframework.http.HttpStatus;

public class NotificationException extends RuntimeException {

    private final HttpStatus status;

    public NotificationException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public NotificationException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
