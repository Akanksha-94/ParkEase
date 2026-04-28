package com.parkease.report.service;

import com.parkease.report.dto.response.PlatformSummary;
import com.parkease.report.dto.response.Report;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AnalyticsService {

    void logOccupancy(UUID lotId);

    double getOccupancyRate(UUID lotId);

    Map<Integer, Double> getOccupancyByHour(UUID lotId);

    List<Integer> getPeakHours(UUID lotId);

    double getRevenueByLot(UUID lotId);

    Map<LocalDate, Double> getRevenueByDay(UUID lotId);

    Map<String, Long> getMostUsedSpotTypes(UUID lotId);

    double getAvgDuration(UUID lotId);

    PlatformSummary getPlatformSummary();

    Report generateDailyReport(UUID lotId);
}
