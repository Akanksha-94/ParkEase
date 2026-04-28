package com.parkease.notification.repository;

import com.parkease.notification.model.Notification;
import com.parkease.notification.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipientId(UUID recipientId);

    List<Notification> findByRecipientIdAndRead(UUID recipientId, boolean read);

    long countByRecipientIdAndRead(UUID recipientId, boolean read);

    List<Notification> findByType(NotificationType type);

    List<Notification> findByRelatedId(UUID relatedId);
}
