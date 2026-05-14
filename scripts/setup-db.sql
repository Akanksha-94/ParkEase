-- ParkEase Database Setup Script
-- Run this against your MySQL server before starting services

CREATE DATABASE IF NOT EXISTS parkease_auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_parking_lot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_parking_spot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_reservation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_report_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS parkease_vehicle_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT schema_name AS 'ParkEase Databases Created:' FROM information_schema.schemata
WHERE schema_name LIKE 'parkease_%';
