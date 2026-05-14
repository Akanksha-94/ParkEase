package com.parkease.notification.dto.request;

import com.parkease.notification.model.NotificationChannel;
import com.parkease.notification.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendNotificationRequest {

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotNull(message = "Channel is required")
    private NotificationChannel channel;

    private Long relatedId;
    private String relatedType;
}
