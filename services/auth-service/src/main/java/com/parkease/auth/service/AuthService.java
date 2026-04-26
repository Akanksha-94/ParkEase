package com.parkease.auth.service;

import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.*;

import java.util.UUID;

public interface AuthService {
    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void logout(String token);

    boolean validateToken(String token);

    AuthResponse refreshToken(String token);

    UserResponse getUserByEmail(String email);

    UserResponse getProfile(UUID userId);

    UserResponse updateProfile(UUID userId, RegisterRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);

    void deactivateAccount(UUID userId);
}
