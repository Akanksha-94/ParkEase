package com.parkease.notification.service;

import com.parkease.notification.dto.request.SendNotificationRequest;
import com.parkease.notification.dto.response.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationResponse send(SendNotificationRequest request);

    void sendBulk(List<SendNotificationRequest> requests);

    NotificationResponse markAsRead(UUID notificationId);

    void markAllRead(UUID recipientId);

    List<NotificationResponse> getByRecipient(UUID recipientId);

    long getUnreadCount(UUID recipientId);

    void deleteNotification(UUID notificationId);

    void sendEmail(String to, String subject, String body);

    void sendSMS(String phoneNumber, String message);

    List<NotificationResponse> getAll();
}
