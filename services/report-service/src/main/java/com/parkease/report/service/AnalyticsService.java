package com.parkease.report.service;

import com.parkease.report.dto.response.PlatformSummary;
import com.parkease.report.dto.response.Report;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;


public interface AnalyticsService {

    void logOccupancy(Long lotId);

    double getOccupancyRate(Long lotId);

    Map<Integer, Double> getOccupancyByHour(Long lotId);

    List<Integer> getPeakHours(Long lotId);

    double getRevenueByLot(Long lotId);

    Map<LocalDate, Double> getRevenueByDay(Long lotId);

    Map<String, Long> getMostUsedSpotTypes(Long lotId);

    double getAvgDuration(Long lotId);

    PlatformSummary getPlatformSummary();

    Report generateDailyReport(Long lotId);
}
