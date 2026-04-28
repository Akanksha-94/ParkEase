package com.parkease.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    private UUID lotId;
    private LocalDate reportDate;
    private double averageOccupancy;
    private double totalRevenue;
    private List<Integer> peakHours;
    private Map<String, Long> spotTypeUtilisation;
    private long totalLogs;
}
