package com.parkease.notification.resource;

import com.parkease.notification.common.response.ApiResponse;
import com.parkease.notification.dto.request.SendNotificationRequest;
import com.parkease.notification.dto.response.NotificationResponse;
import com.parkease.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@Validated
@RequiredArgsConstructor
@Slf4j
public class NotificationResource {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        log.info("POST /notifications - recipient: {}", request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Notification sent", notificationService.send(request)));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<Void>> sendBulk(
            @Valid @RequestBody List<SendNotificationRequest> requests) {
        log.info("POST /notifications/bulk - size: {}", requests.size());
        notificationService.sendBulk(requests);
        return ResponseEntity.accepted()
                .body(ApiResponse.success(202, "Bulk notifications queued", null));
    }

    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getByRecipient(
            @PathVariable Long recipientId) {
        return ResponseEntity.ok(
                ApiResponse.success("Notifications retrieved", notificationService.getByRecipient(recipientId)));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(
                ApiResponse.success("Notification marked as read", notificationService.markAsRead(notificationId)));
    }

    @PutMapping("/recipient/{recipientId}/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@PathVariable Long recipientId) {
        notificationService.markAllRead(recipientId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @GetMapping("/recipient/{recipientId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long recipientId) {
        return ResponseEntity.ok(
                ApiResponse.success("Unread count retrieved", notificationService.getUnreadCount(recipientId)));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("All notifications retrieved", notificationService.getAll()));
    }
}
