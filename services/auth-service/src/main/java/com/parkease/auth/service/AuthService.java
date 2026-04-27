package com.parkease.auth.service;

import com.parkease.auth.dto.request.ChangePasswordRequest;
import com.parkease.auth.dto.request.LoginRequest;
import com.parkease.auth.dto.request.RegisterRequest;
import com.parkease.auth.dto.request.UpdateProfileRequest;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;

import java.util.UUID;

/**
 * Contract for the Auth/User-Service.
 * Covers registration, authentication, JWT lifecycle, profile management,
 * password changes, and account deactivation.
 */
public interface AuthService {

    // ── Registration ──────────────────────────────
    UserResponse register(RegisterRequest request);

    // ── Authentication ────────────────────────────
    AuthResponse login(LoginRequest request);

    void logout(String token);

    boolean validateToken(String token);

    AuthResponse refreshToken(String token);

    // ── Profile ───────────────────────────────────
    UserResponse getUserByEmail(String email);

    UserResponse getProfile(UUID userId);

    UserResponse updateProfile(UUID userId, UpdateProfileRequest request);

    // ── Security ──────────────────────────────────
    void changePassword(UUID userId, ChangePasswordRequest request);

    void deactivateAccount(UUID userId);
}
