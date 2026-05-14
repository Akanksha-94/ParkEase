CREATE TABLE IF NOT EXISTS parking_spots (
    spot_id         BIGINT          NOT NULL AUTO_INCREMENT,
    lot_id          BIGINT          NOT NULL,
    spot_number     VARCHAR(20)     NOT NULL,
    floor           VARCHAR(20),
    spot_type       VARCHAR(30)     NOT NULL,
    vehicle_type    VARCHAR(30)     NOT NULL,
    status          VARCHAR(30)     NOT NULL DEFAULT 'AVAILABLE',
    is_handicapped  TINYINT(1)      NOT NULL DEFAULT 0,
    is_ev_charging  TINYINT(1)      NOT NULL DEFAULT 0,
    price_per_hour  DECIMAL(8,2)    NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (spot_id),
    INDEX idx_lot_id (lot_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
