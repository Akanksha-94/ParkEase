package com.parkease.parkingspot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ParkingSpotServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(ParkingSpotServiceApplication.class, args);
  }
}
