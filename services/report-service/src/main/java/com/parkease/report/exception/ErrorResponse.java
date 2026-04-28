package com.parkease.report.exception;

import java.time.LocalDateTime;

/**
 * Standardized error response body returned by {@link GlobalExceptionHandler}.
 */
public record ErrorResponse(int status, String message, LocalDateTime timestamp) {

    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, LocalDateTime.now());
    }
}
