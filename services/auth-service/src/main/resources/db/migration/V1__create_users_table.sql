CREATE TABLE IF NOT EXISTS users (
    user_id     BIGINT          NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20)     NOT NULL DEFAULT 'DRIVER',
    vehicle_plate VARCHAR(20),
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    profile_pic_url VARCHAR(500),
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
