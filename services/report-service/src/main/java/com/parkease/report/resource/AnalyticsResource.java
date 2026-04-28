package com.parkease.report.resource;

import com.parkease.report.dto.response.PlatformSummary;
import com.parkease.report.dto.response.Report;
import com.parkease.report.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@Validated
@RequiredArgsConstructor
public class AnalyticsResource {

    private final AnalyticsService analyticsService;

    @GetMapping("/{lotId}/occupancy-rate")
    public ResponseEntity<Double> getOccupancyRate(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getOccupancyRate(lotId));
    }

    @GetMapping("/{lotId}/by-hour")
    public ResponseEntity<Map<Integer, Double>> getOccupancyByHour(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getOccupancyByHour(lotId));
    }

    @GetMapping("/{lotId}/peak-hours")
    public ResponseEntity<List<Integer>> getPeakHours(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getPeakHours(lotId));
    }

    @GetMapping("/{lotId}/revenue")
    public ResponseEntity<Double> getRevenue(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getRevenueByLot(lotId));
    }

    @GetMapping("/{lotId}/revenue-by-day")
    public ResponseEntity<Map<LocalDate, Double>> getRevenueByDay(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getRevenueByDay(lotId));
    }

    @GetMapping("/{lotId}/spot-types")
    public ResponseEntity<Map<String, Long>> getSpotTypes(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getMostUsedSpotTypes(lotId));
    }

    @GetMapping("/{lotId}/avg-duration")
    public ResponseEntity<Double> getAvgDuration(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.getAvgDuration(lotId));
    }

    @GetMapping("/platform-summary")
    public ResponseEntity<PlatformSummary> getPlatformSummary() {
        return ResponseEntity.ok(analyticsService.getPlatformSummary());
    }

    @GetMapping("/{lotId}/daily-report")
    public ResponseEntity<Report> generateDailyReport(@PathVariable UUID lotId) {
        return ResponseEntity.ok(analyticsService.generateDailyReport(lotId));
    }
}
