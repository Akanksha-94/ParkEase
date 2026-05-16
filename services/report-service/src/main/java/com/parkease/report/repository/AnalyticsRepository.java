package com.parkease.report.repository;

import com.parkease.report.model.OccupancyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface AnalyticsRepository extends JpaRepository<OccupancyLog, Long> {

    List<OccupancyLog> findByLotId(Long lotId);

    List<OccupancyLog> findByLotIdAndTimestampBetween(Long lotId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(AVG(o.occupancyRate), 0.0) FROM OccupancyLog o WHERE o.lotId = :lotId")
    double avgOccupancyByLotId(@Param("lotId") Long lotId);

    @Query("SELECT EXTRACT(HOUR FROM o.timestamp) as hour, AVG(o.occupancyRate) as avgOcc " +
           "FROM OccupancyLog o WHERE o.lotId = :lotId " +
           "GROUP BY EXTRACT(HOUR FROM o.timestamp) " +
           "ORDER BY avgOcc DESC")
    List<Object[]> findPeakHoursDataByLotId(@Param("lotId") Long lotId);

    List<OccupancyLog> findByVehicleType(String vehicleType);

    @Query("SELECT COUNT(o) FROM OccupancyLog o WHERE o.lotId = :lotId AND o.timestamp >= CURRENT_DATE")
    int countByLotIdToday(@Param("lotId") Long lotId);

    @Query("SELECT COUNT(DISTINCT o.lotId) FROM OccupancyLog o")
    long countDistinctLotId();
}
