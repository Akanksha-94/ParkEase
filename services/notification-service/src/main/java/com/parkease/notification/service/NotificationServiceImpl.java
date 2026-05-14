package com.parkease.notification.service;

import com.parkease.notification.dto.request.SendNotificationRequest;
import com.parkease.notification.dto.response.NotificationResponse;
import com.parkease.notification.exception.NotificationNotFoundException;
import com.parkease.notification.model.Notification;
import com.parkease.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public NotificationResponse send(SendNotificationRequest request) {
        log.info("Sending notification of type {} to recipient {}", request.getType(), request.getRecipientId());

        Notification notification = Notification.builder()
                .recipientId(request.getRecipientId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .channel(request.getChannel())
                .relatedId(request.getRelatedId())
                .relatedType(request.getRelatedType())
                .build();

        Notification saved = notificationRepository.save(notification);

        // Mock channel dispatch
        switch (notification.getChannel()) {
            case EMAIL -> sendEmail("user_" + request.getRecipientId() + "@example.com", notification.getTitle(), notification.getMessage());
            case SMS -> sendSMS("+1234567890", notification.getMessage());
            case APP -> log.info("Dispatched APP notification to user {}", request.getRecipientId());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void sendBulk(List<SendNotificationRequest> requests) {
        log.info("Processing bulk notifications batch of size {}", requests.size());
        for (SendNotificationRequest request : requests) {
            send(request);
        }
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = findOrThrow(notificationId);
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead(Long recipientId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndRead(recipientId, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for recipient {}", unread.size(), recipientId);
    }

    @Override
    public List<NotificationResponse> getByRecipient(Long recipientId) {
        return notificationRepository.findByRecipientId(recipientId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndRead(recipientId, false);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = findOrThrow(notificationId);
        notificationRepository.delete(notification);
        log.info("Deleted notification {}", notificationId);
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        // Stub implementation for email sending
        log.info("MOCK EMAIL -> To: {}, Subject: {}, Body: {}", to, subject, body);
    }

    @Override
    public void sendSMS(String phoneNumber, String message) {
        // Stub implementation for SMS sending
        log.info("MOCK SMS -> To: {}, Message: {}", phoneNumber, message);
    }

    @Override
    public List<NotificationResponse> getAll() {
        return notificationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Notification findOrThrow(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found: " + notificationId));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .recipientId(notification.getRecipientId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .channel(notification.getChannel())
                .relatedId(notification.getRelatedId())
                .relatedType(notification.getRelatedType())
                .read(notification.isRead())
                .sentAt(notification.getSentAt())
                .build();
    }
}
