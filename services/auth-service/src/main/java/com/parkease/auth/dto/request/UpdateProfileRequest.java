package com.parkease.auth.dto.request;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a user's profile.
 * All fields are optional — only non-null values are applied.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {

    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String vehiclePlate;

    private String profilePicUrl;

    /** Optional role change — only ADMIN should normally be allowed to change this. */
    private String role;
}
