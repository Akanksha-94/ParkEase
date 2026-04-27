package com.parkease.parkingspot.exception;

import org.springframework.http.HttpStatus;

public class SpotNotFoundException extends ParkingSpotException {

  public SpotNotFoundException(String message) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
