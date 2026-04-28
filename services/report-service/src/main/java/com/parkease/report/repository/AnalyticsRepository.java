package com.parkease.report.repository;

import com.parkease.report.model.OccupancyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsRepository extends JpaRepository<OccupancyLog, UUID> {

    List<OccupancyLog> findByLotId(UUID lotId);

    List<OccupancyLog> findByLotIdAndTimestampBetween(UUID lotId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(AVG(o.occupancyRate), 0.0) FROM OccupancyLog o WHERE o.lotId = :lotId")
    double avgOccupancyByLotId(@Param("lotId") UUID lotId);

    @Query("SELECT EXTRACT(HOUR FROM o.timestamp) as hour, AVG(o.occupancyRate) as avgOcc " +
           "FROM OccupancyLog o WHERE o.lotId = :lotId " +
           "GROUP BY EXTRACT(HOUR FROM o.timestamp) " +
           "ORDER BY avgOcc DESC")
    List<Object[]> findPeakHoursDataByLotId(@Param("lotId") UUID lotId);

    List<OccupancyLog> findByVehicleType(String vehicleType);

    @Query("SELECT COUNT(o) FROM OccupancyLog o WHERE o.lotId = :lotId AND o.timestamp >= CURRENT_DATE")
    int countByLotIdToday(@Param("lotId") UUID lotId);
}
