CREATE TABLE IF NOT EXISTS occupancy_logs (
    log_id          BIGINT          NOT NULL AUTO_INCREMENT,
    lot_id          BIGINT          NOT NULL,
    spot_id         BIGINT,
    timestamp       DATETIME        NOT NULL,
    occupancy_rate  DOUBLE          NOT NULL,
    available_spots INT             NOT NULL,
    total_spots     INT             NOT NULL,
    vehicle_type    VARCHAR(30),
    PRIMARY KEY (log_id),
    INDEX idx_lot_id (lot_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
