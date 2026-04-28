package com.parkease.report.exception;

import org.springframework.http.HttpStatus;

public class ReportNotFoundException extends ReportException {

    public ReportNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
