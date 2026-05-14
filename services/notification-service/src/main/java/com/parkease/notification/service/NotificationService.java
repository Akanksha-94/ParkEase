package com.parkease.notification.service;

import com.parkease.notification.dto.request.SendNotificationRequest;
import com.parkease.notification.dto.response.NotificationResponse;

import java.util.List;


public interface NotificationService {

    NotificationResponse send(SendNotificationRequest request);

    void sendBulk(List<SendNotificationRequest> requests);

    NotificationResponse markAsRead(Long notificationId);

    void markAllRead(Long recipientId);

    List<NotificationResponse> getByRecipient(Long recipientId);

    long getUnreadCount(Long recipientId);

    void deleteNotification(Long notificationId);

    void sendEmail(String to, String subject, String body);

    void sendSMS(String phoneNumber, String message);

    List<NotificationResponse> getAll();
}
