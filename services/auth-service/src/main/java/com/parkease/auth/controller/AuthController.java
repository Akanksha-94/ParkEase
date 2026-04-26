package com.parkease.auth.controller;

import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.*;
import com.parkease.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Principal principal) {
        return ResponseEntity.ok(authService.getUserByEmail(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(Principal principal,
            @RequestBody RegisterRequest request) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(authService.updateProfile(existing.getUserId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        authService.changePassword(existing.getUserId(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/deactivate")
    public ResponseEntity<Void> deactivateAccount(Principal principal) {
        UserResponse existing = authService.getUserByEmail(principal.getName());
        authService.deactivateAccount(existing.getUserId());
        return ResponseEntity.noContent().build();
    }
}
