package com.parkease.parkingspot.exception;

import org.springframework.http.HttpStatus;

public class ParkingSpotException extends RuntimeException {

  private final HttpStatus status;

  public ParkingSpotException(String message) {
    this(message, HttpStatus.BAD_REQUEST);
  }

  public ParkingSpotException(String message, HttpStatus status) {
    super(message);
    this.status = status;
  }

  public HttpStatus getStatus() {
    return status;
  }
}
