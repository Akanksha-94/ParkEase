package com.parkease.report.service;

import com.parkease.report.dto.response.PlatformSummary;
import com.parkease.report.dto.response.Report;
import com.parkease.report.model.OccupancyLog;
import com.parkease.report.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    @Override
    @Transactional
    public void logOccupancy(Long lotId) {
        log.info("Logging occupancy for lot: {}", lotId);

        OccupancyLog logEntry = OccupancyLog.builder()
                .lotId(lotId)
                .timestamp(LocalDateTime.now())
                .occupancyRate(0.0) // Mock value
                .availableSpots(0)  // Mock value
                .totalSpots(0)      // Mock value
                .vehicleType("UNKNOWN")
                .build();

        analyticsRepository.save(logEntry);
    }

    @Override
    public double getOccupancyRate(Long lotId) {
        return analyticsRepository.avgOccupancyByLotId(lotId);
    }

    @Override
    public Map<Integer, Double> getOccupancyByHour(Long lotId) {
        List<Object[]> data = analyticsRepository.findPeakHoursDataByLotId(lotId);
        Map<Integer, Double> byHour = new HashMap<>();
        for (Object[] row : data) {
            byHour.put(((Number) row[0]).intValue(), ((Number) row[1]).doubleValue());
        }
        return byHour;
    }

    @Override
    public List<Integer> getPeakHours(Long lotId) {
        List<Object[]> data = analyticsRepository.findPeakHoursDataByLotId(lotId);
        return data.stream()
                .limit(3)
                .map(row -> ((Number) row[0]).intValue())
                .collect(Collectors.toList());
    }

    @Override
    public double getRevenueByLot(Long lotId) {
        return 5000.00;
    }

    @Override
    public Map<LocalDate, Double> getRevenueByDay(Long lotId) {
        Map<LocalDate, Double> revenueByDay = new HashMap<>();
        revenueByDay.put(LocalDate.now(), 1250.0);
        revenueByDay.put(LocalDate.now().minusDays(1), 1100.0);
        return revenueByDay;
    }

    @Override
    public Map<String, Long> getMostUsedSpotTypes(Long lotId) {
        List<OccupancyLog> logs = analyticsRepository.findByLotId(lotId);
        return logs.stream()
                .filter(log -> log.getVehicleType() != null)
                .collect(Collectors.groupingBy(OccupancyLog::getVehicleType, Collectors.counting()));
    }

    @Override
    public double getAvgDuration(Long lotId) {
        return 2.5;
    }

    @Override
    public PlatformSummary getPlatformSummary() {
        List<OccupancyLog> allLogs = analyticsRepository.findAll();
        long activeLots = allLogs.stream().map(OccupancyLog::getLotId).distinct().count();
        
        double avgOccupancy = allLogs.stream()
                .mapToDouble(OccupancyLog::getOccupancyRate)
                .average()
                .orElse(76.0); // Baseline if empty
        
        int totalSpots = allLogs.stream()
                .mapToInt(OccupancyLog::getTotalSpots)
                .sum();
                
        int activeSessions = allLogs.size(); // Simplified for demo
        
        double variance = (Math.random() * 2.0) - 1.0;
        
        return PlatformSummary.builder()
                .activeLots(activeLots > 0 ? (int)activeLots : 3)
                .totalSpots(totalSpots > 0 ? totalSpots : 52)
                .availableSpots((int) (totalSpots * (1 - (avgOccupancy/100.0))))
                .platformOccupancyRate(avgOccupancy + variance)
                .dailyRevenue(14500.0 + (variance * 800))
                .build();
    }

    @Override
    public Report generateDailyReport(Long lotId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        List<OccupancyLog> dailyLogs = analyticsRepository.findByLotIdAndTimestampBetween(lotId, startOfDay, endOfDay);
        double avgOccupancy = dailyLogs.stream().mapToDouble(OccupancyLog::getOccupancyRate).average().orElse(0.0);
        
        return Report.builder()
                .lotId(lotId)
                .reportDate(today)
                .averageOccupancy(avgOccupancy)
                .totalRevenue(1250.0) // Mock
                .peakHours(getPeakHours(lotId))
                .spotTypeUtilisation(getMostUsedSpotTypes(lotId))
                .totalLogs(dailyLogs.size())
                .build();
    }
}
