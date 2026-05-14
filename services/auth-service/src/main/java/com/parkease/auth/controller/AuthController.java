package com.parkease.auth.controller;

import com.parkease.auth.common.response.ApiResponse;
import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;
import com.parkease.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for Auth/User-Service.
 *
 * Gateway strips /api/v1 via StripPrefix=2, so this service receives:
 *   Public:    POST /auth/register, POST /auth/login, POST /auth/validate
 *   Secured:   POST /auth/logout, GET|PUT /auth/profile, PUT /auth/password, PUT /auth/deactivate
 *
 * All responses are wrapped in ApiResponse<T> for consistent frontend integration.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    // ──────────────────────────────────────────────
    //  Public endpoints (no gateway AuthFilter)
    // ──────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        log.info("POST /auth/register - email: {}", request.getEmail());
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("POST /auth/login - email: {}", request.getEmail());
        return ResponseEntity.ok(
                ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validate(
            @RequestBody Map<String, String> body) {
        boolean valid = authService.validateToken(body.get("token"));
        return ResponseEntity.ok(
                ApiResponse.success("Token validation result", Map.of("valid", valid)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("If an account exists for " + request.getEmail() + ", a recovery link has been generated.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Password has been reset successfully.", null));
    }

    // ──────────────────────────────────────────────
    //  Secured endpoints (gateway AuthFilter runs)
    // ──────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody Map<String, String> body) {
        log.info("POST /auth/refresh");
        return ResponseEntity.ok(
                ApiResponse.success("Token refreshed", authService.refreshToken(body.get("token"))));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("POST /auth/logout");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile retrieved", authService.getUserByEmail(username)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestHeader("X-User-Name") String username,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse existing = authService.getUserByEmail(username);
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated", authService.updateProfile(existing.getUserId(), request)));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("X-User-Name") String username,
            @Valid @RequestBody ChangePasswordRequest request) {
        UserResponse existing = authService.getUserByEmail(username);
        authService.changePassword(existing.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PutMapping("/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @RequestHeader("X-User-Name") String username) {
        log.info("PUT /auth/deactivate - user: {}", username);
        UserResponse existing = authService.getUserByEmail(username);
        authService.deactivateAccount(existing.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Account deactivated successfully", null));
    }
}
