package com.parkease.report.resource;

import com.parkease.report.common.response.ApiResponse;
import com.parkease.report.dto.response.PlatformSummary;
import com.parkease.report.dto.response.Report;
import com.parkease.report.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@Validated
@RequiredArgsConstructor
@Slf4j
public class AnalyticsResource {

    private final AnalyticsService analyticsService;

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<Double>> getOccupancy(@RequestParam(required = false) Long lotId) {
        log.info("GET /analytics/occupancy - lotId: {}", lotId);
        if (lotId != null) {
            return ResponseEntity.ok(ApiResponse.success("Occupancy rate retrieved", analyticsService.getOccupancyRate(lotId)));
        }
        return ResponseEntity.ok(ApiResponse.success("Platform occupancy rate retrieved", analyticsService.getPlatformSummary().getPlatformOccupancyRate()));
    }

    @GetMapping("/{lotId}/occupancy-rate")
    public ResponseEntity<ApiResponse<Double>> getOccupancyRate(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Occupancy rate retrieved", analyticsService.getOccupancyRate(lotId)));
    }

    @GetMapping("/{lotId}/by-hour")
    public ResponseEntity<ApiResponse<Map<Integer, Double>>> getOccupancyByHour(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Occupancy by hour retrieved", analyticsService.getOccupancyByHour(lotId)));
    }

    @GetMapping("/{lotId}/peak-hours")
    public ResponseEntity<ApiResponse<List<Integer>>> getPeakHours(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Peak hours retrieved", analyticsService.getPeakHours(lotId)));
    }

    @GetMapping("/{lotId}/revenue")
    public ResponseEntity<ApiResponse<Double>> getRevenue(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Revenue retrieved", analyticsService.getRevenueByLot(lotId)));
    }

    @GetMapping("/{lotId}/revenue-by-day")
    public ResponseEntity<ApiResponse<Map<LocalDate, Double>>> getRevenueByDay(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Revenue by day retrieved", analyticsService.getRevenueByDay(lotId)));
    }

    @GetMapping("/{lotId}/spot-types")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getSpotTypes(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Spot type usage retrieved", analyticsService.getMostUsedSpotTypes(lotId)));
    }

    @GetMapping("/{lotId}/avg-duration")
    public ResponseEntity<ApiResponse<Double>> getAvgDuration(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Average duration retrieved", analyticsService.getAvgDuration(lotId)));
    }

    @GetMapping("/platform-summary")
    public ResponseEntity<ApiResponse<PlatformSummary>> getPlatformSummary() {
        return ResponseEntity.ok(ApiResponse.success("Platform summary retrieved", analyticsService.getPlatformSummary()));
    }

    @GetMapping("/{lotId}/daily-report")
    public ResponseEntity<ApiResponse<Report>> generateDailyReport(@PathVariable Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Daily report generated", analyticsService.generateDailyReport(lotId)));
    }
}
