package com.parkease.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSummary {
    private int activeLots;
    private int totalSpots;
    private int availableSpots;
    private double platformOccupancyRate;
    private double dailyRevenue;
}
