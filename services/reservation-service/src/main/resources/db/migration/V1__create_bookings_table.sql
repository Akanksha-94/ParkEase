CREATE TABLE IF NOT EXISTS bookings (
    booking_id      BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    lot_id          BIGINT          NOT NULL,
    spot_id         BIGINT,
    vehicle_plate   VARCHAR(20)     NOT NULL,
    vehicle_type    VARCHAR(30)     NOT NULL,
    booking_type    VARCHAR(30)     NOT NULL,
    start_time      DATETIME        NOT NULL,
    end_time        DATETIME        NOT NULL,
    status          VARCHAR(30)     NOT NULL DEFAULT 'PENDING',
    total_amount    DECIMAL(8,2),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_lot_id (lot_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
