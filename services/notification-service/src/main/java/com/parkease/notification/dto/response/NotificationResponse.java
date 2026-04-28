package com.parkease.notification.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parkease.notification.model.NotificationChannel;
import com.parkease.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private UUID notificationId;
    private UUID recipientId;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationChannel channel;
    private UUID relatedId;
    private String relatedType;
    private boolean read;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime sentAt;
}
