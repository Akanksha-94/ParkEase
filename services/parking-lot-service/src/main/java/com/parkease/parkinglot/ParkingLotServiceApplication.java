package com.parkease.parkinglot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ParkingLotServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ParkingLotServiceApplication.class, args);
    }
}
