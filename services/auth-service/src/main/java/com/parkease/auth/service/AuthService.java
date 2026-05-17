package com.parkease.auth.service;

import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;

import java.util.List;



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

    UserResponse getProfile(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    List<UserResponse> getUsersByRole(String role);

    // ── Security ──────────────────────────────────
    void changePassword(Long userId, ChangePasswordRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void deactivateAccount(Long userId);
}
