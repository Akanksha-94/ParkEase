package com.parkease.auth.controller;

import com.parkease.auth.dto.request.ChangePasswordRequest;
import com.parkease.auth.dto.request.LoginRequest;
import com.parkease.auth.dto.request.RegisterRequest;
import com.parkease.auth.dto.request.UpdateProfileRequest;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;
import com.parkease.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * REST controller for Auth/User-Service.
 * Base path: /api/v1/auth
 *
 * Public endpoints:  POST /register, POST /login, POST /refresh, GET /validate
 * Protected endpoints (Bearer JWT required): GET|PUT /profile, PUT /password, PUT /deactivate
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication and user management endpoints")
public class AuthController {

    private final AuthService authService;

    // ──────────────────────────────────────────────
    //  Public endpoints
    // ──────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive a JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Refresh an existing (still-valid) JWT token.
     * Expects: { "token": "<current-jwt>" }
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh a JWT token")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        return ResponseEntity.ok(authService.refreshToken(token));
    }

    /**
     * Validate whether a token is structurally valid and not expired.
     * Expects: { "token": "<jwt>" }
     * Returns:  { "valid": true|false }
     */
    @PostMapping("/validate")
    @Operation(summary = "Validate a JWT token")
    public ResponseEntity<Map<String, Boolean>> validate(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        boolean valid = authService.validateToken(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    /**
     * Logout — stateless; client must discard the token.
     * This endpoint exists as a hook for future server-side token blacklisting.
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout (client-side token discard)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────
    //  Protected endpoints (JWT required)
    // ──────────────────────────────────────────────

    @GetMapping("/profile")
    @Operation(summary = "Get the authenticated user's profile")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> getProfile(Principal principal) {
        return ResponseEntity.ok(authService.getUserByEmail(principal.getName()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update the authenticated user's profile")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<UserResponse> updateProfile(Principal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(authService.updateProfile(existing.getUserId(), request));
    }

    @PutMapping("/password")
    @Operation(summary = "Change the authenticated user's password")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> changePassword(Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        authService.changePassword(existing.getUserId(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/deactivate")
    @Operation(summary = "Soft-deactivate the authenticated user's account")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> deactivateAccount(Principal principal) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        authService.deactivateAccount(existing.getUserId());
        return ResponseEntity.noContent().build();
    }
}
