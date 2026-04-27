package com.parkease.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO representing a user's public profile data.
 * Password hash is never included.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String vehiclePlate;
    private String profilePicUrl;
    private boolean isActive;
    private LocalDateTime createdAt;
}
