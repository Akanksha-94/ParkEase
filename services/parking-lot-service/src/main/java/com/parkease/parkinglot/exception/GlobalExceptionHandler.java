package com.parkease.parkinglot.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Global exception handler — converts domain exceptions into structured JSON error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LotNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleLotNotFound(LotNotFoundException ex) {
        return new ResponseEntity<>(ErrorResponse.of(ex.getStatus().value(), ex.getMessage()), ex.getStatus());
    }

    @ExceptionHandler(NoAvailableSpotsException.class)
    public ResponseEntity<ErrorResponse> handleNoAvailableSpots(NoAvailableSpotsException ex) {
        return new ResponseEntity<>(ErrorResponse.of(ex.getStatus().value(), ex.getMessage()), ex.getStatus());
    }

    @ExceptionHandler(ParkingLotException.class)
    public ResponseEntity<ErrorResponse> handleParkingLotException(ParkingLotException ex) {
        return new ResponseEntity<>(ErrorResponse.of(ex.getStatus().value(), ex.getMessage()), ex.getStatus());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponse error = ErrorResponse.of(HttpStatus.FORBIDDEN.value(), "Access denied.");
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        String detailMessage = String.format("%s: %s", ex.getClass().getName(), ex.getMessage());
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                detailMessage);
        return ResponseEntity.internalServerError().body(error);
    }
}
