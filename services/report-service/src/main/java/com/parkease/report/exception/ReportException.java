package com.parkease.report.exception;

import org.springframework.http.HttpStatus;

public class ReportException extends RuntimeException {

    private final HttpStatus status;

    public ReportException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public ReportException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
