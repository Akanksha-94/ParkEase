package com.parkease.notification.model;

public enum NotificationType {
    BOOKING,
    CHECKIN,
    EXPIRY,
    CHECKOUT,
    PAYMENT,
    PROMO,
    SYSTEM   // Admin-generated alerts (e.g., sent to Managers)
}
