CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id      BIGINT          NOT NULL AUTO_INCREMENT,
    owner_id        BIGINT          NOT NULL,
    license_plate   VARCHAR(20)     NOT NULL UNIQUE,
    make            VARCHAR(50)     NOT NULL,
    model           VARCHAR(50)     NOT NULL,
    color           VARCHAR(30)     NOT NULL,
    vehicle_type    VARCHAR(30)     NOT NULL,
    is_ev           TINYINT(1)      NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    registered_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vehicle_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_license_plate (license_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
