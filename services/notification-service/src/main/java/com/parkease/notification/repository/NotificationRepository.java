package com.parkease.notification.repository;

import com.parkease.notification.model.Notification;
import com.parkease.notification.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientId(Long recipientId);

    List<Notification> findByRecipientIdAndRead(Long recipientId, boolean read);

    long countByRecipientIdAndRead(Long recipientId, boolean read);

    List<Notification> findByType(NotificationType type);

    List<Notification> findByRelatedId(Long relatedId);
}
