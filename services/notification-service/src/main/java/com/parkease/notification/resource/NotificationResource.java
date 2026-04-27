package com.parkease.notification.resource;

import com.parkease.notification.dto.request.SendNotificationRequest;
import com.parkease.notification.dto.response.NotificationResponse;
import com.parkease.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@Validated
@RequiredArgsConstructor
public class NotificationResource {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        return ResponseEntity.ok(notificationService.send(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Void> sendBulk(@Valid @RequestBody List<SendNotificationRequest> requests) {
        notificationService.sendBulk(requests);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<List<NotificationResponse>> getByRecipient(@PathVariable UUID recipientId) {
        return ResponseEntity.ok(notificationService.getByRecipient(recipientId));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId));
    }

    @PutMapping("/recipient/{recipientId}/read-all")
    public ResponseEntity<Void> markAllRead(@PathVariable UUID recipientId) {
        notificationService.markAllRead(recipientId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recipient/{recipientId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable UUID recipientId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(recipientId));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<NotificationResponse>> getAll() {
        return ResponseEntity.ok(notificationService.getAll());
    }
}
